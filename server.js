const http = require('http');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const querystring = require('querystring');

const PORT = process.env.PORT || 3000;
const ROOT = __dirname;

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf',
  '.cur': 'image/x-icon'
};

// Map of all 53 university codes to full Vietnamese names
const SCHOOL_NAMES = {
  BDU: 'Trường Đại học Bình Dương',
  BVU: 'Trường Đại học Bà Rịa - Vũng Tàu',
  COFER: 'Trường Cao đẳng Kinh tế Đối ngoại',
  CTUET: 'Trường Đại học Kỹ thuật - Công nghệ Cần Thơ',
  DAU: 'Trường Đại học Kiến trúc Đà Nẵng',
  DAV: 'Học viện Ngoại giao',
  EIU: 'Trường Đại học Quốc tế Miền Đông',
  EPU: 'Trường Đại học Điện lực',
  FTU: 'Trường Đại học Ngoại thương',
  GDU: 'Trường Đại học Gia Định',
  HANU: 'Trường Đại học Hà Nội',
  HCMUAF: 'Trường Đại học Nông Lâm TP.HCM',
  HCMUC: 'Trường Đại học Văn hóa TP.HCM',
  HCMULAW: 'Trường Đại học Luật TP.HCM',
  HCMUS: 'Trường Đại học Khoa học Tự nhiên - ĐHQG TP.HCM',
  HCMUSSH: 'Trường Đại học Khoa học Xã hội và Nhân văn - ĐHQG TP.HCM',
  HCMUTE: 'Trường Đại học Sư phạm Kỹ thuật TP.HCM',
  HCE: 'Trường Đại học Kinh tế - Đại học Huế',
  HITU: 'Trường Cao đẳng Công thương TP.HCM',
  HIU: 'Trường Đại học Quốc tế Hồng Bàng',
  HLU: 'Trường Đại học Luật Hà Nội',
  HNUE: 'Trường Đại học Sư phạm Hà Nội',
  HPMU: 'Trường Đại học Y Dược Hải Phòng',
  HSU: 'Trường Đại học Hoa Sen',
  HUB: 'Trường Đại học Ngân hàng TP.HCM',
  HUFLIT: 'Trường Đại học Ngoại ngữ - Tin học TP.HCM',
  HUIT: 'Trường Đại học Công Thương TP.HCM',
  HUMG: 'Trường Đại học Mỏ - Địa chất',
  HUST: 'Đại học Bách khoa Hà Nội',
  HUTECH: 'Trường Đại học Công nghệ TP.HCM',
  HVNH: 'Học viện Ngân hàng',
  IUH: 'Trường Đại học Công nghiệp TP.HCM',
  KTHCM: 'Trường Cao đẳng Kinh tế TP.HCM',
  LHU: 'Trường Đại học Lạc Hồng',
  NDUN: 'Trường Đại học Điều dưỡng Nam Định',
  NEU: 'Đại học Kinh tế Quốc dân',
  NLU: 'Trường Đại học Nông Lâm TP.HCM',
  NTT: 'Trường Đại học Nguyễn Tất Thành',
  NTU: 'Trường Đại học Nha Trang',
  OU: 'Trường Đại học Mở TP.HCM',
  PTIT: 'Học viện Công nghệ Bưu chính Viễn thông',
  SGU: 'Trường Đại học Sài Gòn',
  STU: 'Trường Đại học Công nghệ Sài Gòn',
  TDMU: 'Trường Đại học Thủ Dầu Một',
  TDTU: 'Trường Đại học Tôn Đức Thắng',
  THANGLONG: 'Trường Đại học Thăng Long',
  TLU: 'Trường Đại học Thủy lợi',
  TMU: 'Trường Đại học Thương mại',
  TVU: 'Trường Đại học Trà Vinh',
  UAH: 'Trường Đại học Kiến trúc TP.HCM',
  UEF: 'Trường Đại học Kinh tế - Tài chính TP.HCM',
  UEH: 'Đại học Kinh tế TP.HCM',
  UEL: 'Trường Đại học Kinh tế - Luật (ĐHQG TP.HCM)',
  UFM: 'Trường Đại học Tài chính - Marketing',
  UIT: 'Trường Đại học Công nghệ Thông tin (ĐHQG TP.HCM)',
  UMP: 'Đại học Y Dược TP.HCM',
  UT: 'Trường Đại học Giao thông Vận tải TP.HCM',
  UTC: 'Trường Đại học Giao thông Vận tải',
  VAU: 'Học viện Hàng không Việt Nam',
  VHU: 'Trường Đại học Văn Hiến',
  VLU: 'Trường Đại học Văn Lang',
  VNUA: 'Học viện Nông nghiệp Việt Nam',
  VNUIS: 'Trường Quốc tế - ĐHQG Hà Nội',
  ACTVN: 'Học viện Kỹ thuật Mật mã'
};

// Exact AES-128-CBC Decryptor matching EncryptMaLHP() in jhgjufu9ds878OJN89J.js (key & IV: "vhupsc@.c*^@192!")
const AES_KEY = Buffer.from('vhupsc@.c*^@192!', 'utf8');
const AES_IV = Buffer.from('vhupsc@.c*^@192!', 'utf8');

function decryptMaLHP(urlEncodedCipher) {
  try {
    const b64 = decodeURIComponent(urlEncodedCipher);
    const decipher = crypto.createDecipheriv('aes-128-cbc', AES_KEY, AES_IV);
    let decrypted = decipher.update(b64, 'base64', 'utf8');
    decrypted += decipher.final('utf8');
    // Format is "<maLHP>!@**55@<UTCString>"
    return decrypted.split('!@**55@')[0] || decrypted;
  } catch (e) {
    return null;
  }
}

// Registered courses state in memory for HCMUTE (/dkmh/)
let registeredCourses = [
  {
    CurriculumID: '232_LLCT130105_01',
    MaMH: 'LLCT130105',
    TenMH: 'Triết học Mác - Lênin',
    STC: 3,
    Nhom: '01CLC',
    TKB: 'Thứ 2 (Tiết 1-3) - Phòng A3-302',
    GV: 'TS. Nguyễn Văn A',
    NgayDK: '05/11/2026 12:00:00'
  },
  {
    CurriculumID: '232_INIT130185_04',
    MaMH: 'INIT130185',
    TenMH: 'Nhập môn ngành CNTT',
    STC: 3,
    Nhom: '04CLC',
    TKB: 'Thứ 4 (Tiết 7-9) - Phòng A2-401',
    GV: 'ThS. Trần Thị B',
    NgayDK: '05/11/2026 12:01:30'
  }
];

// Registered courses state in memory for EdusoftWeb/AQTech portals (/dkmh-*)
let edusoftRegistered = [
  {
    id_to_hoc: 'TO_001',
    ma_mon: 'IT001',
    ten_mon: 'Lập trình hướng đối tượng',
    so_tc: 4,
    tkb: 'Thứ 2 (Tiết 1-4) - P.C102',
    ngay_dk: '05/11/2026 12:05:00'
  }
];

function parsePostBody(req) {
  return new Promise((resolve) => {
    let body = '';
    req.on('data', (chunk) => { body += chunk.toString(); });
    req.on('end', () => {
      try {
        if (body.trim().startsWith('{')) {
          resolve(JSON.parse(body));
        } else {
          resolve(querystring.parse(body));
        }
      } catch (e) {
        resolve({});
      }
    });
  });
}

function sendJson(res, status, obj) {
  res.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Access-Control-Allow-Origin': '*'
  });
  res.end(JSON.stringify(obj));
}

const server = http.createServer(async (req, res) => {
  const parsedUrl = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
  let pathname = decodeURIComponent(parsedUrl.pathname);

  // 1. Handle POST /contact/process.php (dkmh.net/contact form)
  if (req.method === 'POST' && pathname === '/contact/process.php') {
    const data = await parsePostBody(req);
    res.writeHead(200, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end(`Cảm ơn ${data.name || 'bạn'} (${data.email || 'N/A'})! Tin nhắn của bạn đã được hệ thống DKMH.NET ghi nhận thành công.`);
    return;
  }

  // 2. Handle POST /api/ (tools1s.com function.js buy_cr)
  if (req.method === 'POST' && (pathname === '/api/' || pathname === '/api')) {
    const data = await parsePostBody(req);
    let info = {};
    try { info = JSON.parse(data.data || '{}'); } catch (e) {}
    sendJson(res, 200, {
      status: 'success',
      message: `[SwalAlert_Success] Đã mua thành công ${info.times || 15} lượt sử dụng (Giá: ${info.price || 0}đ)!`
    });
    return;
  }

  // 3. Handle POST /dkmh*/index.php or POST to current tool page (foot.js heartbeat polling)
  if (req.method === 'POST' && (pathname.endsWith('/index.php') || pathname === '/dkmh/' || pathname === '/dkmh' || /^\/dkmh-[a-z0-9-]+\/?$/i.test(pathname))) {
    sendJson(res, 200, {
      status: 'success',
      TimeRefresh_Milisecond: 120000,
      my_money: '150,000',
      slq: '25',
      status_text: 'VIP Active'
    });
    return;
  }

  // 4. Handle POST /dkmh/process.php (HCMUTE Cookie + Batch/Table DKMH engine)
  if (req.method === 'POST' && pathname.endsWith('/process.php')) {
    const body = await parsePostBody(req);
    const actionType = body.actionType || '';
    const stepI = parseInt(body.Settings_i || body.i || '1', 10);

    // Decrypt Data_MaLHP using exact key "vhupsc@.c*^@192!"
    let decryptedClasses = [];
    if (body.Data_MaLHP) {
      try {
        const arr = JSON.parse(body.Data_MaLHP);
        decryptedClasses = arr.map(item => ({
          maLHP: item.maLHP,
          decrypted: decryptMaLHP(item.Encrypt_maLHP) || item.maLHP
        }));
      } catch (e) {}
    }

    if (actionType === 'xem_ket_qua') {
      const rowsHtml = registeredCourses.map((c, idx) => `
        <tr>
          <td class="text-center">${idx + 1}</td>
          <td><b>${c.MaMH}</b></td>
          <td>${c.TenMH}</td>
          <td class="text-center">${c.STC}</td>
          <td><span class="label label-primary">${c.CurriculumID}</span></td>
          <td>${c.TKB}</td>
          <td>${c.GV}</td>
          <td>${c.NgayDK}</td>
          <td class="text-center">
            <button type="button" id="btn_huy_${idx}" class="btn btn-danger btn-xs"
              data-malhp="${c.CurriculumID}" data-tenmh="${c.TenMH}"
              onclick="HuyLopHocPhanDangKy(this)">
              <i class="fa fa-trash"></i> Hủy HP
            </button>
          </td>
        </tr>`).join('');

      const tableHtml = `
        <div class="box box-success" style="margin-top:15px;">
          <div class="box-header with-border">
            <h3 class="box-title"><i class="fa fa-check-square-o"></i> Danh sách học phần đã đăng ký (${registeredCourses.length} môn)</h3>
          </div>
          <div class="box-body table-responsive">
            <table class="table table-bordered table-hover">
              <thead>
                <tr class="bg-green">
                  <th>STT</th><th>Mã MH</th><th>Tên môn học</th><th>STC</th><th>Mã LHP</th><th>Thời khóa biểu</th><th>Giảng viên</th><th>Thời gian ĐK</th><th>Thao tác</th>
                </tr>
              </thead>
              <tbody>${rowsHtml}</tbody>
            </table>
          </div>
        </div>`;

      sendJson(res, 200, {
        status: 'done',
        GetKQDK: true,
        message: 'Đã tải danh sách kết quả đăng ký học phần thành công!',
        dt_show: registeredCourses,
        html_input: {
          id: 'show_table_kqdh',
          html: tableHtml,
          Act: 'html'
        }
      });
      return;
    }

    if (actionType === 'HuyLopHocPhanDangKy') {
      let toCancel = [];
      try { toCancel = JSON.parse(body.data || '[]'); } catch (e) {}
      const cancelIds = toCancel.map(x => x.CurriculumID || x.maLHP);
      registeredCourses = registeredCourses.filter(c => !cancelIds.includes(c.CurriculumID));
      sendJson(res, 200, {
        status: 'done',
        HuyLopHocPhanDangKy: true,
        message: `Đã hủy thành công lớp học phần: ${cancelIds.join(', ')}`
      });
      return;
    }

    if (actionType === 'showDSMonHoc') {
      const courseTableHtml = `
        <div class="table-responsive">
          <table class="table table-bordered table-striped">
            <thead>
              <tr class="bg-primary">
                <th>Chọn</th><th>Mã môn học</th><th>Tên môn học</th><th>Số tín chỉ</th><th>Loại môn</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td><input type="checkbox" onchange="SelectMonHocChoDangKy(this)" data-id="MATH132401" data-name="Toán cao cấp A1"></td>
                <td><b>MATH132401</b></td><td>Toán cao cấp A1</td><td>3</td><td>Bắt buộc</td>
              </tr>
              <tr>
                <td><input type="checkbox" onchange="SelectMonHocChoDangKy(this)" data-id="COMP130302" data-name="Cấu trúc dữ liệu và giải thuật"></td>
                <td><b>COMP130302</b></td><td>Cấu trúc dữ liệu và giải thuật</td><td>3</td><td>Chuyên ngành</td>
              </tr>
              <tr>
                <td><input type="checkbox" onchange="SelectMonHocChoDangKy(this)" data-id="ENGL130137" data-name="Anh văn 1"></td>
                <td><b>ENGL130137</b></td><td>Anh văn 1</td><td>3</td><td>Đại cương</td>
              </tr>
            </tbody>
          </table>
          <button type="button" class="btn btn-primary" onclick="GetLopHocPhan()"><i class="fa fa-arrow-right"></i> Xem danh sách Lớp học phần</button>
        </div>`;

      sendJson(res, 200, {
        status: 'done',
        message: '[SwalAlert_Success] Đã tải danh sách môn học từ cổng đào tạo!',
        message_noti: `<span class="text-success"><i class="fa fa-check"></i> Tải thành công 3 môn học trong Chương trình đào tạo (${body.ctdt || 'CTDT'}).</span>`,
        html_input: {
          idOld: ['html_show_login'],
          id: 'html_show_monhoc',
          idAppend: 'html_show_monhoc_body',
          html: courseTableHtml,
          Act: 'html'
        }
      });
      return;
    }

    if (actionType === 'showDSLopHoc') {
      const classList = [
        { CurriculumID: '232_MATH132401_01', StudyUnitID: 'MATH132401', MaMH: 'MATH132401', TenMH: 'Toán cao cấp A1', STC: 3, Nhom: '01CLC', TKB: 'Thứ 3 (Tiết 1-3) - A4-301', GV: 'PGS.TS Lê Văn C', SiSo: '42/45' },
        { CurriculumID: '232_COMP130302_02', StudyUnitID: 'COMP130302', MaMH: 'COMP130302', TenMH: 'Cấu trúc dữ liệu và giải thuật', STC: 3, Nhom: '02CLC', TKB: 'Thứ 5 (Tiết 4-6) - PM-A5', GV: 'TS. Phạm Văn D', SiSo: '39/40' }
      ];
      const rows = classList.map(c => `
        <tr>
          <td><input type="checkbox" onchange="SelectLopHocPhanChoDangKy(this)" data-id="${c.CurriculumID}" data-mamh="${c.MaMH}" data-tenmh="${c.TenMH}"></td>
          <td><b>${c.CurriculumID}</b></td>
          <td>${c.TenMH}</td>
          <td>${c.STC}</td>
          <td>${c.TKB}</td>
          <td>${c.GV}</td>
          <td><span class="label label-warning">${c.SiSo}</span></td>
        </tr>`).join('');

      const html = `
        <div class="table-responsive">
          <table class="table table-bordered table-striped">
            <thead>
              <tr class="bg-info"><th>Chọn</th><th>Mã LHP</th><th>Tên môn học</th><th>STC</th><th>Thời khóa biểu</th><th>Giảng viên</th><th>Sĩ số</th></tr>
            </thead>
            <tbody>${rows}</tbody>
          </table>
          <button type="button" class="btn btn-success btn-lg" onclick="DangKyHocPhan()"><i class="fa fa-bolt"></i> Bắt đầu tự động Đăng ký học phần</button>
        </div>`;

      sendJson(res, 200, {
        status: 'done',
        dt_show: classList,
        message: 'Đã tải danh sách lớp học phần!',
        html_input: {
          idOld: ['html_show_monhoc'],
          id: 'html_show_lophoc',
          idAppend: 'html_show_lophoc_body',
          html,
          Act: 'html'
        }
      });
      return;
    }

    const typeDkmh = String(body.Type_DKMH || '0');
    if (typeDkmh === '1' && actionType === '') {
      const selectHtml = `
        <div class="form-group">
          <label>Chọn Chương trình đào tạo:</label>
          <select id="ctdt" class="form-control" onchange="ChangeCTDT()">
            <option value="CTDT_CNTT">Ngành Công nghệ Thông tin (Hệ Đại trà / CLC)</option>
            <option value="CTDT_KT">Ngành Kinh tế & Quản trị</option>
          </select>
        </div>
        <div class="form-group">
          <label>Chọn Loại đăng ký học phần:</label>
          <select id="loaidangkyhp" class="form-control">
            <option value="KH">Đăng ký theo Kế hoạch</option>
            <option value="NKH">Đăng ký Ngoài kế hoạch / Học cải thiện</option>
          </select>
        </div>
        <button type="button" class="btn btn-primary" onclick="GetDSMonHoc($('#ctdt').val(), $('#loaidangkyhp').val(), 'Theo kế hoạch', [], 1)">
          <i class="fa fa-list"></i> Tải danh sách môn học
        </button>`;

      sendJson(res, 200, {
        status: 'done',
        loginSuccess: true,
        message: '[SwalAlert_Success] Đăng nhập bằng Cookie Google thành công!',
        message_noti: '<span class="text-success"><b>[LOGIN OK]</b> Xác thực phiên Google OAuth Cookie thành công. Vui lòng chọn CTĐT để lấy môn học.</span>',
        html_input: {
          id: 'html_show_monhoc_body',
          html: selectHtml,
          Act: 'html'
        }
      });
      return;
    }

    if (stepI < 2) {
      sendJson(res, 200, {
        status: 'success',
        RequestDkmh: true,
        delay: 1,
        delay_busy: 2,
        loginSuccess: true,
        message_noti: `<span class="text-warning"><i class="fa fa-refresh fa-spin"></i> [Lần thử #${stepI}] Đang gửi gói tin đăng ký (${decryptedClasses.length} mã LHP đã giải mã AES-128-CBC: <code>${decryptedClasses.map(d => d.decrypted).join(', ')}</code>)... Cổng trường đang bận, tự động thử lại sau 1s!</span>`
      });
    } else {
      for (const item of decryptedClasses) {
        if (item.maLHP && !registeredCourses.some(c => c.CurriculumID === item.maLHP)) {
          registeredCourses.push({
            CurriculumID: item.maLHP,
            MaMH: item.maLHP.split('_')[0] || 'MH001',
            TenMH: 'Học phần Đăng ký Nhanh (' + item.maLHP + ')',
            STC: 3,
            Nhom: '01',
            TKB: 'Thứ 6 (Tiết 1-3) - Phòng Trung Tâm',
            GV: 'GV. Hệ Thống',
            NgayDK: new Date().toLocaleString('vi-VN')
          });
        }
      }
      sendJson(res, 200, {
        status: 'done',
        RequestDkmh: true,
        loginSuccess: true,
        message: '[SwalAlert_Success] Đã đăng ký thành công toàn bộ lớp học phần!',
        MessDoneAct: `Hoàn tất đăng ký tự động sau ${stepI} lần gửi request! Bạn có thể bấm "Xem kết quả đăng ký" ở bên dưới để kiểm tra hoặc hủy môn.`,
        message_noti: `<span class="text-success"><b><i class="fa fa-check-circle"></i> [THÀNH CÔNG ở lần thử #${stepI}]</b> Đã đăng ký thành công: <b>${decryptedClasses.map(d => d.maLHP).join(', ') || 'Các lớp đã chọn'}</b>!</span>`
      });
    }
    return;
  }

  // 5. Handle POST /api.php or /dkmh-*/api.php (EdusoftWeb / AQTech university portals)
  if (req.method === 'POST' && pathname.endsWith('/api.php')) {
    const body = await parsePostBody(req);
    if (body.action === 'login') {
      const dsNhomTo = [
        { id_to_hoc: 'TO_001', ma_mon: 'IT001', ten_mon: 'Lập trình hướng đối tượng', nhom_to: '01', so_tc: 4, tkb: 'Thứ 2 (Tiết 1-4) - P.C102', sl_cl: 8, is_dk: false, enable: true },
        { id_to_hoc: 'TO_002', ma_mon: 'IT002', ten_mon: 'Cơ sở dữ liệu', nhom_to: '02', so_tc: 4, tkb: 'Thứ 4 (Tiết 6-9) - P.B205', sl_cl: 15, is_dk: false, enable: true },
        { id_to_hoc: 'TO_003', ma_mon: 'MA001', ten_mon: 'Xác suất thống kê', nhom_to: '01', so_tc: 3, tkb: 'Thứ 6 (Tiết 1-3) - P.A108', sl_cl: 3, is_dk: false, enable: true },
        { id_to_hoc: 'TO_004', ma_mon: 'EN002', ten_mon: 'Tiếng Anh chuyên ngành CNTT', nhom_to: '03', so_tc: 3, tkb: 'Thứ 7 (Tiết 1-3) - P.D301', sl_cl: 20, is_dk: false, enable: true }
      ];
      // Exact nested schema expected by Fun_Login_TK_MK_aahHFUr84989.js:
      // _0x511e44.data.type == 'locdsnhomto' && Data_locdsnhomto = _0x511e44.data.dataWeb
      sendJson(res, 200, {
        status: 'done',
        message: `[SwalAlert_Success] Đăng nhập tài khoản ${body.username || 'Sinh viên'} thành công!`,
        message_noti: `<span class="text-success"><i class="fa fa-check"></i> Đã đăng nhập MSSV <b>${body.username || 'SV'}</b> và tải danh sách 4 nhóm/tổ học phần đang mở trong học kỳ. Hãy tích chọn môn bên dưới để đăng ký!</span>`,
        data: {
          type: 'locdsnhomto',
          dataWeb: {
            data: {
              ds_nhom_to: dsNhomTo
            }
          }
        }
      });
      return;
    }

    if (body.action === 'dkmh') {
      let sel = [];
      try { sel = JSON.parse(body.selected || '[]'); } catch (e) {}
      for (const item of sel) {
        if (!edusoftRegistered.some(r => r.id_to_hoc === item.id_to_hoc)) {
          edusoftRegistered.push({
            id_to_hoc: item.id_to_hoc,
            ma_mon: item.ma_mon,
            ten_mon: item.ten_mon,
            so_tc: item.so_tc || 3,
            tkb: item.tkb || 'Thứ 2 (Tiết 1-3)',
            ngay_dk: new Date().toLocaleString('vi-VN')
          });
        }
      }
      sendJson(res, 200, {
        status: 'done',
        message: `[SwalAlert_Success] Đã đăng ký thành công ${sel.length} môn học!`,
        MessDoneAct: `Hệ thống đã ghi nhận đăng ký thành công: ${sel.map(s => s.ten_mon + ' (' + s.ma_mon + ')').join(', ')}.`,
        message_noti: `<span class="text-success"><b>[ĐĂNG KÝ THÀNH CÔNG]</b> ${sel.map(s => s.ma_mon + ' - ' + s.ten_mon).join('; ')}</span>`
      });
      return;
    }

    if (body.action === 'xem_ket_qua') {
      const rows = edusoftRegistered.map((r, i) => `
        <tr>
          <td class="text-center">${i + 1}</td>
          <td><b>${r.ma_mon}</b></td>
          <td>${r.ten_mon}</td>
          <td class="text-center">${r.so_tc}</td>
          <td>${r.tkb}</td>
          <td>${r.ngay_dk}</td>
          <td class="text-center">
            <button type="button" class="btn btn-danger btn-xs" onclick="HuyMonEdusoft('${r.id_to_hoc}')"><i class="fa fa-trash"></i> Hủy</button>
          </td>
        </tr>`).join('');
      const html = `
        <div class="box box-success" style="margin-top:15px;">
          <div class="box-header with-border"><h3 class="box-title"><i class="fa fa-check-square-o"></i> Kết quả đăng ký học phần (${edusoftRegistered.length} môn)</h3></div>
          <div class="box-body table-responsive">
            <table class="table table-bordered table-striped">
              <thead><tr class="bg-green"><th>STT</th><th>Mã MH</th><th>Tên môn học</th><th>STC</th><th>Thời khóa biểu</th><th>Ngày ĐK</th><th>Thao tác</th></tr></thead>
              <tbody>${rows}</tbody>
            </table>
          </div>
        </div>`;
      sendJson(res, 200, {
        status: 'done',
        message: 'Đã tải bảng kết quả đăng ký học phần!',
        html
      });
      return;
    }

    if (body.action === 'huy_mon') {
      edusoftRegistered = edusoftRegistered.filter(r => r.id_to_hoc !== body.id_to_hoc);
      sendJson(res, 200, {
        status: 'done',
        message: '[SwalAlert_Success] Đã hủy học phần thành công!'
      });
      return;
    }
  }

  // 6. Fallback redirects / local mappings for shared stylesheets & status icons
  if (pathname === '/bootstrap/css/bootstrap.min.css') {
    res.writeHead(302, { Location: 'https://cdnjs.cloudflare.com/ajax/libs/twitter-bootstrap/3.3.7/css/bootstrap.min.css' });
    res.end();
    return;
  }
  if (pathname === '/dist/css/AdminLTE.min.css') {
    res.writeHead(302, { Location: 'https://cdnjs.cloudflare.com/ajax/libs/admin-lte/2.4.18/css/AdminLTE.min.css' });
    res.end();
    return;
  }
  if (pathname === '/src/animate.css') {
    pathname = '/assets/css/animate.css';
  }
  if (pathname.startsWith('/images/dkmh-aqv1/')) {
    res.writeHead(200, { 'Content-Type': 'image/svg+xml' });
    res.end('<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18"><circle cx="9" cy="9" r="8" fill="#00a65a"/></svg>');
    return;
  }

  // 7. Dynamic routing for any /dkmh-<school> endpoint (all 53 universities in #tool)
  const schoolMatch = pathname.match(/^\/(dkmh-[a-z0-9-]+)\/?$/i);
  if (schoolMatch) {
    const slug = schoolMatch[1].toLowerCase();
    const schoolCode = slug.replace(/^dkmh-/, '').toUpperCase();
    const schoolFullName = SCHOOL_NAMES[schoolCode] || `Trường Đại học (${schoolCode})`;
    let bduTemplate = fs.readFileSync(path.join(ROOT, 'dkmh-bdu', 'index.html'), 'utf8');
    if (schoolCode !== 'BDU') {
      bduTemplate = bduTemplate
        .replace(/Trường Đại học Bình Dương/gi, schoolFullName)
        .replace(/Đại học Bình Dương/gi, schoolFullName)
        .replace(/\bBDU\b/g, schoolCode);
    }
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end(bduTemplate);
    return;
  }

  // 8. Static file serving
  if (pathname === '/') pathname = '/index.html';
  if (pathname === '/contact' || pathname === '/contact/') pathname = '/contact/index.html';
  if (pathname === '/dkmh' || pathname === '/dkmh/') pathname = '/dkmh/index.html';

  const filePath = path.join(ROOT, pathname);
  if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
    const ext = path.extname(filePath).toLowerCase();
    res.writeHead(200, { 'Content-Type': MIME_TYPES[ext] || 'application/octet-stream' });
    fs.createReadStream(filePath).pipe(res);
  } else {
    res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end('404 Not Found: ' + pathname);
  }
});

server.listen(PORT, () => {
  console.log(`================================================================`);
  console.log(`🚀 DKMH.NET + TOOLS1S.COM 1:1 Clone Server is running!`);
  console.log(`👉 Landing Page (#tool): http://localhost:${PORT}/#tool`);
  console.log(`👉 Contact Page:         http://localhost:${PORT}/contact`);
  console.log(`👉 Tool HCMUTE (Cookie): http://localhost:${PORT}/dkmh/`);
  console.log(`👉 Tool BDU/EdusoftWeb:  http://localhost:${PORT}/dkmh-bdu/`);
  console.log(`================================================================`);
});
