const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const querystring = require('querystring');

const AES_KEY = Buffer.from('1209199012091990', 'utf8');
const AES_IV = Buffer.from('1209199012091990', 'utf8');

function decryptMaLHP(urlEncodedCipher) {
  try {
    const b64 = decodeURIComponent(urlEncodedCipher);
    const decipher = crypto.createDecipheriv('aes-128-cbc', AES_KEY, AES_IV);
    let decrypted = decipher.update(b64, 'base64', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
  } catch (e) {
    return null;
  }
}

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

function parseBody(req) {
  return new Promise((resolve) => {
    if (req.body && typeof req.body === 'object') {
      return resolve(req.body);
    }
    if (typeof req.body === 'string') {
      try {
        return resolve(req.body.trim().startsWith('{') ? JSON.parse(req.body) : querystring.parse(req.body));
      } catch (e) {
        return resolve({});
      }
    }
    let raw = '';
    req.on('data', chunk => { raw += chunk.toString(); });
    req.on('end', () => {
      try {
        resolve(raw.trim().startsWith('{') ? JSON.parse(raw) : querystring.parse(raw));
      } catch (e) {
        resolve({});
      }
    });
  });
}

function sendJson(res, status, obj) {
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.statusCode = status;
  res.end(JSON.stringify(obj));
}

module.exports = async (req, res) => {
  const parsedUrl = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
  const route = parsedUrl.searchParams.get('route') || '';
  const schoolParam = (parsedUrl.searchParams.get('school') || 'bdu').toUpperCase();

  // 1. Status icon SVG
  if (route === 'aqv1_icon') {
    res.setHeader('Content-Type', 'image/svg+xml');
    res.statusCode = 200;
    res.end('<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18"><circle cx="9" cy="9" r="8" fill="#00a65a"/></svg>');
    return;
  }

  // 2. Dynamic school portal page (/dkmh-<school>)
  if (route === 'school_page') {
    const p1 = path.join(__dirname, '..', 'dkmh-bdu', 'index.html');
    const p2 = path.join(process.cwd(), 'dkmh-bdu', 'index.html');
    const bduPath = fs.existsSync(p1) ? p1 : p2;
    let html = fs.existsSync(bduPath) ? fs.readFileSync(bduPath, 'utf8') : '<h1>DKMH Tool</h1>';
    if (schoolParam !== 'BDU') {
      html = html
        .replace(/BDU/g, schoolParam)
        .replace(/Đại học Bình Dương/gi, `Trường Đại học (${schoolParam})`);
    }
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.statusCode = 200;
    res.end(html);
    return;
  }

  const body = await parseBody(req);

  // 3. Contact form (/contact/process.php)
  if (route === 'contact_process') {
    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    res.statusCode = 200;
    res.end(`Cảm ơn ${body.name || 'bạn'} (${body.email || 'N/A'})! Tin nhắn của bạn đã được hệ thống DKMH.NET ghi nhận.`);
    return;
  }

  // 4. Buy credits (/api/)
  if (route === 'buy_credits') {
    let info = {};
    try { info = JSON.parse(body.data || '{}'); } catch (e) {}
    sendJson(res, 200, {
      status: 'success',
      message: `[SwalAlert_Success] Đã mua thành công ${info.times || 15} lượt sử dụng (Giá: ${info.price || 0}đ)!`
    });
    return;
  }

  // 5. Heartbeat polling (/dkmh*/index.php)
  if (route === 'heartbeat') {
    sendJson(res, 200, {
      status: 'success',
      TimeRefresh_Milisecond: 120000,
      my_money: '150,000',
      slq: '25',
      status_text: 'VIP Active'
    });
    return;
  }

  // 6. HCMUTE Cookie + Batch/Table DKMH (/dkmh/process.php)
  if (route === 'dkmh_process') {
    const actionType = body.actionType || '';
    const stepI = parseInt(body.Settings_i || body.i || '1', 10);

    let decryptedClasses = [];
    if (body.Data_MaLHP) {
      try {
        const arr = JSON.parse(body.Data_MaLHP);
        decryptedClasses = arr.map(item => ({
          maLHP: item.maLHP,
          decrypted: decryptMaLHP(item.Encrypt_maLHP)
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
      const cancelIds = toCancel.map(x => x.CurriculumID);
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
        { CurriculumID: '232_MATH132401_01', MaMH: 'MATH132401', TenMH: 'Toán cao cấp A1', STC: 3, Nhom: '01CLC', TKB: 'Thứ 3 (Tiết 1-3) - A4-301', GV: 'PGS.TS Lê Văn C', SiSo: '42/45' },
        { CurriculumID: '232_COMP130302_02', MaMH: 'COMP130302', TenMH: 'Cấu trúc dữ liệu và giải thuật', STC: 3, Nhom: '02CLC', TKB: 'Thứ 5 (Tiết 4-6) - PM-A5', GV: 'TS. Phạm Văn D', SiSo: '39/40' }
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

  // 7. Username/Password portal engine (/dkmh-*/api.php)
  if (route === 'school_api') {
    if (body.action === 'login') {
      sendJson(res, 200, {
        status: 'done',
        type: 'locdsnhomto',
        message: `[SwalAlert_Success] Đăng nhập tài khoản ${body.username || 'Sinh viên'} (${schoolParam}) thành công!`,
        message_noti: `<span class="text-success"><i class="fa fa-check"></i> Đã đăng nhập MSSV <b>${body.username || 'SV'}</b> tại cổng <b>${schoolParam}</b> và tải danh sách nhóm tổ học phần mở trong học kỳ.</span>`,
        data: {
          ds_nhom_to: [
            { id_to_hoc: 'TO_001', ma_mon: 'IT001', ten_mon: 'Lập trình hướng đối tượng', nhom_to: '01', so_tc: 4, tkb: 'Thứ 2 (Tiết 1-4) - P.C102', sl_cl: 8, is_dk: false, enable: true },
            { id_to_hoc: 'TO_002', ma_mon: 'IT002', ten_mon: 'Cơ sở dữ liệu', nhom_to: '02', so_tc: 4, tkb: 'Thứ 4 (Tiết 6-9) - P.B205', sl_cl: 15, is_dk: false, enable: true },
            { id_to_hoc: 'TO_003', ma_mon: 'MA001', ten_mon: 'Xác suất thống kê', nhom_to: '01', so_tc: 3, tkb: 'Thứ 6 (Tiết 1-3) - P.A108', sl_cl: 3, is_dk: false, enable: true }
          ]
        }
      });
      return;
    }
    if (body.action === 'dkmh') {
      let sel = [];
      try { sel = JSON.parse(body.selected || '[]'); } catch (e) {}
      sendJson(res, 200, {
        status: 'done',
        message: `[SwalAlert_Success] Đã đăng ký thành công ${sel.length} môn học!`,
        MessDoneAct: `Hệ thống đã ghi nhận đăng ký thành công: ${sel.map(s => s.ten_mon + ' (' + s.ma_mon + ')').join(', ')}.`,
        message_noti: `<span class="text-success"><b>[ĐĂNG KÝ THÀNH CÔNG]</b> ${sel.map(s => s.ma_mon + ' - ' + s.ten_mon).join('; ')}</span>`
      });
      return;
    }
  }

  sendJson(res, 200, { status: 'success', route });
};
