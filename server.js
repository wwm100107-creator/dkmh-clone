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

// AES-128-CBC Decryptor matching EncryptMaLHP() in tools1s.com/dkmh/
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

// Registered courses state in memory for local simulation
let registeredCourses = [
  {
    CurriculumID: '232_LLCT130105_01',
    MaMH: 'LLCT130105',
    TenMH: 'Triáº¿t há»c MÃ¡c - LÃªnin',
    STC: 3,
    Nhom: '01CLC',
    TKB: 'Thá»© 2 (Tiáº¿t 1-3) - PhÃ²ng A3-302',
    GV: 'TS. Nguyá»…n VÄƒn A',
    NgayDK: '05/11/2026 12:00:00'
  },
  {
    CurriculumID: '232_INIT130185_04',
    MaMH: 'INIT130185',
    TenMH: 'Nháº­p mÃ´n ngÃ nh CNTT',
    STC: 3,
    Nhom: '04CLC',
    TKB: 'Thá»© 4 (Tiáº¿t 7-9) - PhÃ²ng A2-401',
    GV: 'ThS. Tráº§n Thá»‹ B',
    NgayDK: '05/11/2026 12:01:30'
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
  if (req.method === 'POST' && (pathname === '/contact/process.php' || pathname === '/process.php')) {
    const data = await parsePostBody(req);
    res.writeHead(200, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end(`Cáº£m Æ¡n ${data.name || 'báº¡n'} (${data.email || 'N/A'})! Tin nháº¯n cá»§a báº¡n Ä‘Ã£ Ä‘Æ°á»£c há»‡ thá»‘ng DKMH.NET ghi nháº­n.`);
    return;
  }

  // 2. Handle POST /api/ (tools1s.com function.js buy_cr)
  if (req.method === 'POST' && (pathname === '/api/' || pathname === '/api')) {
    const data = await parsePostBody(req);
    let info = {};
    try { info = JSON.parse(data.data || '{}'); } catch (e) {}
    sendJson(res, 200, {
      status: 'success',
      message: `[SwalAlert_Success] ÄÃ£ mua thÃ nh cÃ´ng ${info.times || 15} lÆ°á»£t sá»­ dá»¥ng (GiÃ¡: ${info.price || 0}Ä‘)!`
    });
    return;
  }

  // 3. Handle POST /dkmh*/index.php (tools1s.com foot.js heartbeat polling)
  if (req.method === 'POST' && pathname.endsWith('/index.php')) {
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

    // Decrypt Data_MaLHP if provided to demonstrate AES-128-CBC verification
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
              <i class="fa fa-trash"></i> Há»§y HP
            </button>
          </td>
        </tr>`).join('');

      const tableHtml = `
        <div class="box box-success" style="margin-top:15px;">
          <div class="box-header with-border">
            <h3 class="box-title"><i class="fa fa-check-square-o"></i> Danh sÃ¡ch há»c pháº§n Ä‘Ã£ Ä‘Äƒng kÃ½ (${registeredCourses.length} mÃ´n)</h3>
          </div>
          <div class="box-body table-responsive">
            <table class="table table-bordered table-hover">
              <thead>
                <tr class="bg-green">
                  <th>STT</th><th>MÃ£ MH</th><th>TÃªn mÃ´n há»c</th><th>STC</th><th>MÃ£ LHP</th><th>Thá»i khÃ³a biá»ƒu</th><th>Giáº£ng viÃªn</th><th>Thá»i gian ÄK</th><th>Thao tÃ¡c</th>
                </tr>
              </thead>
              <tbody>${rowsHtml}</tbody>
            </table>
          </div>
        </div>`;

      sendJson(res, 200, {
        status: 'done',
        GetKQDK: true,
        message: 'ÄÃ£ táº£i danh sÃ¡ch káº¿t quáº£ Ä‘Äƒng kÃ½ há»c pháº§n thÃ nh cÃ´ng!',
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
        message: `ÄÃ£ há»§y thÃ nh cÃ´ng lá»›p há»c pháº§n: ${cancelIds.join(', ')}`
      });
      return;
    }

    if (actionType === 'showDSMonHoc') {
      const courseTableHtml = `
        <div class="table-responsive">
          <table class="table table-bordered table-striped">
            <thead>
              <tr class="bg-primary">
                <th>Chá»n</th><th>MÃ£ mÃ´n há»c</th><th>TÃªn mÃ´n há»c</th><th>Sá»‘ tÃ­n chá»‰</th><th>Loáº¡i mÃ´n</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td><input type="checkbox" onchange="SelectMonHocChoDangKy(this)" data-id="MATH132401" data-name="ToÃ¡n cao cáº¥p A1"></td>
                <td><b>MATH132401</b></td><td>ToÃ¡n cao cáº¥p A1</td><td>3</td><td>Báº¯t buá»™c</td>
              </tr>
              <tr>
                <td><input type="checkbox" onchange="SelectMonHocChoDangKy(this)" data-id="COMP130302" data-name="Cáº¥u trÃºc dá»¯ liá»‡u vÃ  giáº£i thuáº­t"></td>
                <td><b>COMP130302</b></td><td>Cáº¥u trÃºc dá»¯ liá»‡u vÃ  giáº£i thuáº­t</td><td>3</td><td>ChuyÃªn ngÃ nh</td>
              </tr>
              <tr>
                <td><input type="checkbox" onchange="SelectMonHocChoDangKy(this)" data-id="ENGL130137" data-name="Anh vÄƒn 1"></td>
                <td><b>ENGL130137</b></td><td>Anh vÄƒn 1</td><td>3</td><td>Äáº¡i cÆ°Æ¡ng</td>
              </tr>
            </tbody>
          </table>
          <button type="button" class="btn btn-primary" onclick="GetLopHocPhan()"><i class="fa fa-arrow-right"></i> Xem danh sÃ¡ch Lá»›p há»c pháº§n</button>
        </div>`;

      sendJson(res, 200, {
        status: 'done',
        message: '[SwalAlert_Success] ÄÃ£ táº£i danh sÃ¡ch mÃ´n há»c tá»« cá»•ng Ä‘Ã o táº¡o!',
        message_noti: `<span class="text-success"><i class="fa fa-check"></i> Táº£i thÃ nh cÃ´ng 3 mÃ´n há»c trong ChÆ°Æ¡ng trÃ¬nh Ä‘Ã o táº¡o (${body.ctdt || 'CTDT'}).</span>`,
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
        { CurriculumID: '232_MATH132401_01', MaMH: 'MATH132401', TenMH: 'ToÃ¡n cao cáº¥p A1', STC: 3, Nhom: '01CLC', TKB: 'Thá»© 3 (Tiáº¿t 1-3) - A4-301', GV: 'PGS.TS LÃª VÄƒn C', SiSo: '42/45' },
        { CurriculumID: '232_COMP130302_02', MaMH: 'COMP130302', TenMH: 'Cáº¥u trÃºc dá»¯ liá»‡u vÃ  giáº£i thuáº­t', STC: 3, Nhom: '02CLC', TKB: 'Thá»© 5 (Tiáº¿t 4-6) - PM-A5', GV: 'TS. Pháº¡m VÄƒn D', SiSo: '39/40' }
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
              <tr class="bg-info"><th>Chá»n</th><th>MÃ£ LHP</th><th>TÃªn mÃ´n há»c</th><th>STC</th><th>Thá»i khÃ³a biá»ƒu</th><th>Giáº£ng viÃªn</th><th>SÄ© sá»‘</th></tr>
            </thead>
            <tbody>${rows}</tbody>
          </table>
          <button type="button" class="btn btn-success btn-lg" onclick="DangKyHocPhan()"><i class="fa fa-bolt"></i> Báº¯t Ä‘áº§u tá»± Ä‘á»™ng ÄÄƒng kÃ½ há»c pháº§n</button>
        </div>`;

      sendJson(res, 200, {
        status: 'done',
        dt_show: classList,
        message: 'ÄÃ£ táº£i danh sÃ¡ch lá»›p há»c pháº§n!',
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

    // Default: Fast Batch Registration (Type_DKMH == 0) or Table Registration (actionType == 'dkmh')
    const typeDkmh = String(body.Type_DKMH || '0');
    if (typeDkmh === '1' && actionType === '') {
      // Transition from Cookie Login to Course Selection view
      const selectHtml = `
        <div class="form-group">
          <label>Chá»n ChÆ°Æ¡ng trÃ¬nh Ä‘Ã o táº¡o:</label>
          <select id="ctdt" class="form-control" onchange="ChangeCTDT()">
            <option value="CTDT_CNTT">NgÃ nh CÃ´ng nghá»‡ ThÃ´ng tin (Há»‡ Äáº¡i trÃ  / CLC)</option>
            <option value="CTDT_KT">NgÃ nh Kinh táº¿ & Quáº£n trá»‹</option>
          </select>
        </div>
        <div class="form-group">
          <label>Chá»n Loáº¡i Ä‘Äƒng kÃ½ há»c pháº§n:</label>
          <select id="loaidangkyhp" class="form-control">
            <option value="KH">ÄÄƒng kÃ½ theo Káº¿ hoáº¡ch</option>
            <option value="NKH">ÄÄƒng kÃ½ NgoÃ i káº¿ hoáº¡ch / Há»c cáº£i thiá»‡n</option>
          </select>
        </div>
        <button type="button" class="btn btn-primary" onclick="GetDSMonHoc($('#ctdt').val(), $('#loaidangkyhp').val(), 'Theo káº¿ hoáº¡ch', [], 1)">
          <i class="fa fa-list"></i> Táº£i danh sÃ¡ch mÃ´n há»c
        </button>`;

      sendJson(res, 200, {
        status: 'done',
        loginSuccess: true,
        message: '[SwalAlert_Success] ÄÄƒng nháº­p báº±ng Cookie Google thÃ nh cÃ´ng!',
        message_noti: '<span class="text-success"><b>[LOGIN OK]</b> XÃ¡c thá»±c phiÃªn Google OAuth Cookie thÃ nh cÃ´ng. Vui lÃ²ng chá»n CTÄT Ä‘á»ƒ láº¥y mÃ´n há»c.</span>',
        html_input: {
          id: 'html_show_monhoc_body',
          html: selectHtml,
          Act: 'html'
        }
      });
      return;
    }

    // Simulate 2-step retry polling then success for Fast Batch Registration
    if (stepI < 2) {
      sendJson(res, 200, {
        status: 'success',
        RequestDkmh: true,
        delay: 1,
        delay_busy: 2,
        loginSuccess: true,
        message_noti: `<span class="text-warning"><i class="fa fa-refresh fa-spin"></i> [Láº§n thá»­ #${stepI}] Äang gá»­i gÃ³i tin Ä‘Äƒng kÃ½ (${decryptedClasses.length} mÃ£ LHP Ä‘Ã£ giáº£i mÃ£ AES-128-CBC: <code>${decryptedClasses.map(d => d.decrypted).join(', ')}</code>)... Cá»•ng trÆ°á»ng Ä‘ang báº­n, tá»± Ä‘á»™ng thá»­ láº¡i sau 1s!</span>`
      });
    } else {
      // Add to registeredCourses
      for (const item of decryptedClasses) {
        if (item.maLHP && !registeredCourses.some(c => c.CurriculumID === item.maLHP)) {
          registeredCourses.push({
            CurriculumID: item.maLHP,
            MaMH: item.maLHP.split('_')[0] || 'MH001',
            TenMH: 'Há»c pháº§n ÄÄƒng kÃ½ Nhanh (' + item.maLHP + ')',
            STC: 3,
            Nhom: '01',
            TKB: 'Thá»© 6 (Tiáº¿t 1-3) - PhÃ²ng Trung TÃ¢m',
            GV: 'GV. Há»‡ Thá»‘ng',
            NgayDK: new Date().toLocaleString('vi-VN')
          });
        }
      }
      sendJson(res, 200, {
        status: 'done',
        RequestDkmh: true,
        loginSuccess: true,
        message: '[SwalAlert_Success] ÄÃ£ Ä‘Äƒng kÃ½ thÃ nh cÃ´ng toÃ n bá»™ lá»›p há»c pháº§n!',
        MessDoneAct: `HoÃ n táº¥t Ä‘Äƒng kÃ½ tá»± Ä‘á»™ng sau ${stepI} láº§n gá»­i request! Báº¡n cÃ³ thá»ƒ báº¥m "Xem káº¿t quáº£ Ä‘Äƒng kÃ½" á»Ÿ bÃªn dÆ°á»›i Ä‘á»ƒ kiá»ƒm tra hoáº·c há»§y mÃ´n.`,
        message_noti: `<span class="text-success"><b><i class="fa fa-check-circle"></i> [THÃ€NH CÃ”NG á»Ÿ láº§n thá»­ #${stepI}]</b> ÄÃ£ Ä‘Äƒng kÃ½ thÃ nh cÃ´ng: <b>${decryptedClasses.map(d => d.maLHP).join(', ') || 'CÃ¡c lá»›p Ä‘Ã£ chá»n'}</b>!</span>`
      });
    }
    return;
  }

  // 5. Handle POST /dkmh-*/api.php (Username/Password portal engine: BDU, OU, SGU, etc.)
  if (req.method === 'POST' && pathname.endsWith('/api.php')) {
    const body = await parsePostBody(req);
    if (body.action === 'login') {
      sendJson(res, 200, {
        status: 'done',
        type: 'locdsnhomto',
        message: `[SwalAlert_Success] ÄÄƒng nháº­p tÃ i khoáº£n ${body.username || 'Sinh viÃªn'} thÃ nh cÃ´ng!`,
        message_noti: `<span class="text-success"><i class="fa fa-check"></i> ÄÃ£ Ä‘Äƒng nháº­p MSSV <b>${body.username || 'SV'}</b> vÃ  táº£i danh sÃ¡ch nhÃ³m tá»• há»c pháº§n má»Ÿ trong há»c ká»³.</span>`,
        data: {
          ds_nhom_to: [
            { id_to_hoc: 'TO_001', ma_mon: 'IT001', ten_mon: 'Láº­p trÃ¬nh hÆ°á»›ng Ä‘á»‘i tÆ°á»£ng', nhom_to: '01', so_tc: 4, tkb: 'Thá»© 2 (Tiáº¿t 1-4) - P.C102', sl_cl: 8, is_dk: false, enable: true },
            { id_to_hoc: 'TO_002', ma_mon: 'IT002', ten_mon: 'CÆ¡ sá»Ÿ dá»¯ liá»‡u', nhom_to: '02', so_tc: 4, tkb: 'Thá»© 4 (Tiáº¿t 6-9) - P.B205', sl_cl: 15, is_dk: false, enable: true },
            { id_to_hoc: 'TO_003', ma_mon: 'MA001', ten_mon: 'XÃ¡c suáº¥t thá»‘ng kÃª', nhom_to: '01', so_tc: 3, tkb: 'Thá»© 6 (Tiáº¿t 1-3) - P.A108', sl_cl: 3, is_dk: false, enable: true }
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
        message: `[SwalAlert_Success] ÄÃ£ Ä‘Äƒng kÃ½ thÃ nh cÃ´ng ${sel.length} mÃ´n há»c!`,
        MessDoneAct: `Há»‡ thá»‘ng Ä‘Ã£ ghi nháº­n Ä‘Äƒng kÃ½ thÃ nh cÃ´ng: ${sel.map(s => s.ten_mon + ' (' + s.ma_mon + ')').join(', ')}.`,
        message_noti: `<span class="text-success"><b>[ÄÄ‚NG KÃ THÃ€NH CÃ”NG]</b> ${sel.map(s => s.ma_mon + ' - ' + s.ten_mon).join('; ')}</span>`
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
    let bduTemplate = fs.readFileSync(path.join(ROOT, 'dkmh-bdu', 'index.html'), 'utf8');
    if (schoolCode !== 'BDU') {
      bduTemplate = bduTemplate
        .replace(/BDU/g, schoolCode)
        .replace(/Äáº¡i há»c BÃ¬nh DÆ°Æ¡ng/gi, `TrÆ°á»ng Äáº¡i há»c (${schoolCode})`);
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
  console.log(`ðŸš€ DKMH.NET + TOOLS1S.COM 1:1 Clone Server is running!`);
  console.log(`ðŸ‘‰ Landing Page (#tool): http://localhost:${PORT}/#tool`);
  console.log(`ðŸ‘‰ Contact Page:         http://localhost:${PORT}/contact`);
  console.log(`ðŸ‘‰ Tool HCMUTE (Cookie): http://localhost:${PORT}/dkmh/`);
  console.log(`ðŸ‘‰ Tool BDU/EdusoftWeb:  http://localhost:${PORT}/dkmh-bdu/`);
  console.log(`================================================================`);
});


