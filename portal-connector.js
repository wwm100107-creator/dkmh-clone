const https = require('https');
const http = require('http');
const crypto = require('crypto');
const querystring = require('querystring');

// Complete directory of all 53 universities with their real training portal URLs and portal engine types
const SCHOOL_PORTALS = {
  HCMUTE: { name: 'Trường Đại học Sư phạm Kỹ thuật TP.HCM', type: 'PSC', url: 'https://dkmh.hcmute.edu.vn', loginPath: '/Student/Home' },
  BDU:    { name: 'Trường Đại học Bình Dương', type: 'AQTECH', url: 'https://daotao.bdu.edu.vn' },
  BVU:    { name: 'Trường Đại học Bà Rịa - Vũng Tàu', type: 'AQTECH', url: 'https://sinhvien.bvu.edu.vn' },
  COFER:  { name: 'Trường Cao đẳng Kinh tế Đối ngoại', type: 'AQTECH', url: 'https://daotao.cofer.edu.vn' },
  CTUET:  { name: 'Trường Đại học Kỹ thuật - Công nghệ Cần Thơ', type: 'AQTECH', url: 'https://htql.ctuet.edu.vn' },
  DAU:    { name: 'Trường Đại học Kiến trúc Đà Nẵng', type: 'AQTECH', url: 'https://daotao.dau.edu.vn' },
  DAV:    { name: 'Học viện Ngoại giao', type: 'AQTECH', url: 'https://daotao.dav.edu.vn' },
  EIU:    { name: 'Trường Đại học Quốc tế Miền Đông', type: 'AQTECH', url: 'https://portal.eiu.edu.vn' },
  EPU:    { name: 'Trường Đại học Điện lực', type: 'ASC', url: 'https://sinhvien.epu.edu.vn' },
  FTU:    { name: 'Trường Đại học Ngoại thương', type: 'AQTECH', url: 'https://ftugate.ftu.edu.vn' },
  GDU:    { name: 'Trường Đại học Gia Định', type: 'ASC', url: 'https://sinhvien.giadinh.edu.vn' },
  HANU:   { name: 'Trường Đại học Hà Nội', type: 'AQTECH', url: 'https://qldt.hanu.edu.vn' },
  HCMUAF: { name: 'Trường Đại học Nông Lâm TP.HCM', type: 'AQTECH', url: 'https://dkmh.hcmuaf.edu.vn' },
  HCMUC:  { name: 'Trường Đại học Văn hóa TP.HCM', type: 'AQTECH', url: 'https://daotao.hcmuc.edu.vn' },
  HCMUE:  { name: 'Trường Đại học Sư phạm TP.HCM', type: 'PSC', url: 'https://dkmh.hcmue.edu.vn' },
  HDU:    { name: 'Trường Đại học Hồng Đức', type: 'AQTECH', url: 'https://daotao.hdu.edu.vn' },
  HITU:   { name: 'Trường Cao đẳng Công thương TP.HCM', type: 'AQTECH', url: 'https://daotao.hitu.edu.vn' },
  HIU:    { name: 'Trường Đại học Quốc tế Hồng Bàng', type: 'PSC', url: 'https://dkmh.hiu.vn' },
  HLU:    { name: 'Trường Đại học Luật Hà Nội', type: 'CMC', url: 'https://daotao.hlu.edu.vn' },
  HNUE:   { name: 'Trường Đại học Sư phạm Hà Nội', type: 'CMC', url: 'https://dtdh.hnue.edu.vn' },
  HPMU:   { name: 'Trường Đại học Y Dược Hải Phòng', type: 'CMC', url: 'https://daotao.hpmu.edu.vn' },
  HUB:    { name: 'Trường Đại học Ngân hàng TP.HCM', type: 'PSC', url: 'https://dkmh.hub.edu.vn' },
  HUCE:   { name: 'Trường Đại học Xây dựng Hà Nội', type: 'ASC', url: 'https://daotao.huce.edu.vn' },
  HUFLIT: { name: 'Trường Đại học Ngoại ngữ - Tin học TP.HCM', type: 'PSC', url: 'https://dkmh.huflit.edu.vn' },
  HUIT:   { name: 'Trường Đại học Công Thương TP.HCM', type: 'ASC', url: 'https://sinhvien.huit.edu.vn' },
  HUMG:   { name: 'Trường Đại học Mỏ - Địa chất', type: 'AQTECH', url: 'https://daotao.humg.edu.vn' },
  HVNH:   { name: 'Học viện Ngân hàng', type: 'CMC', url: 'https://daotao.hvnh.edu.vn' },
  IUH:    { name: 'Trường Đại học Công nghiệp TP.HCM', type: 'ASC', url: 'https://sv.iuh.edu.vn' },
  KTHCM:  { name: 'Trường Cao đẳng Kinh tế TP.HCM', type: 'AQTECH', url: 'https://daotao.kthcm.edu.vn' },
  NDUN:   { name: 'Trường Đại học Điều dưỡng Nam Định', type: 'AQTECH', url: 'https://daotao.ndun.edu.vn' },
  NEU:    { name: 'Đại học Kinh tế Quốc dân', type: 'PSC', url: 'https://daotao.neu.edu.vn' },
  NTT:    { name: 'Trường Đại học Nguyễn Tất Thành', type: 'ASC', url: 'https://phongdaotao.ntt.edu.vn' },
  OU:     { name: 'Trường Đại học Mở TP.HCM', type: 'AQTECH', url: 'https://tienichsv.ou.edu.vn' },
  PTIT:   { name: 'Học viện Công nghệ Bưu chính Viễn thông', type: 'AQTECH', url: 'https://qldt.ptit.edu.vn' },
  SGU:    { name: 'Trường Đại học Sài Gòn', type: 'AQTECH', url: 'https://thongtindaotao.sgu.edu.vn' },
  STU:    { name: 'Trường Đại học Công nghệ Sài Gòn', type: 'AQTECH', url: 'https://daotao.stu.edu.vn' },
  TDMU:   { name: 'Trường Đại học Thủ Dầu Một', type: 'AQTECH', url: 'https://dkmh.tdmu.edu.vn' },
  THANGLONG: { name: 'Trường Đại học Thăng Long', type: 'CMC', url: 'https://sinhvien.thanglong.edu.vn' },
  TLU:    { name: 'Trường Đại học Thủy lợi', type: 'CMC', url: 'https://sinhvien1.tlu.edu.vn' },
  TMU:    { name: 'Trường Đại học Thương mại', type: 'CMC', url: 'https://dangkyhoc.tmu.edu.vn' },
  TVU:    { name: 'Trường Đại học Trà Vinh', type: 'AQTECH', url: 'https://ttsv.tvu.edu.vn' },
  UAH:    { name: 'Trường Đại học Kiến trúc TP.HCM', type: 'AQTECH', url: 'https://daotao.uah.edu.vn' },
  UEF:    { name: 'Trường Đại học Kinh tế - Tài chính TP.HCM', type: 'PSC', url: 'https://daotao.uef.edu.vn' },
  UEH:    { name: 'Đại học Kinh tế TP.HCM', type: 'PSC', url: 'https://student.ueh.edu.vn' },
  UEL:    { name: 'Trường Đại học Kinh tế - Luật (ĐHQG TP.HCM)', type: 'PSC', url: 'https://dkmh.uel.edu.vn' },
  UFM:    { name: 'Trường Đại học Tài chính - Marketing', type: 'PSC', url: 'https://uis.ufm.edu.vn' },
  UMP:    { name: 'Đại học Y Dược TP.HCM', type: 'PSC', url: 'https://dkmh.ump.edu.vn' },
  UNETI:  { name: 'Trường Đại học Kinh tế - Kỹ thuật Công nghiệp', type: 'ASC', url: 'https://sinhvien.uneti.edu.vn' },
  UT:     { name: 'Trường Đại học Giao thông Vận tải TP.HCM', type: 'ASC', url: 'https://sv.ut.edu.vn' },
  VAU:    { name: 'Học viện Hàng không Việt Nam', type: 'AQTECH', url: 'https://daotao.vaa.edu.vn' },
  VHU:    { name: 'Trường Đại học Văn Hiến', type: 'PSC', url: 'https://portal.vhu.edu.vn' },
  VLU:    { name: 'Trường Đại học Văn Lang', type: 'PSC', url: 'https://dkmh.vanlanguni.edu.vn' },
  VNUA:   { name: 'Học viện Nông nghiệp Việt Nam', type: 'AQTECH', url: 'https://daotao.vnua.edu.vn' },
  VNUIS:  { name: 'Trường Quốc tế - ĐHQG Hà Nội', type: 'AQTECH', url: 'https://sinhvien.is.vnu.edu.vn' },
  ACTVN:  { name: 'Học viện Kỹ thuật Mật mã', type: 'CMC', url: 'https://qldt.actvn.edu.vn' }
};

// In-memory session store mapping ClientId/username to real portal Bearer token & cookies
const portalSessions = new Map();

function rawHttpRequest(urlStr, options = {}) {
  return new Promise((resolve, reject) => {
    const u = new URL(urlStr);
    const lib = u.protocol === 'https:' ? https : http;
    const reqOpts = {
      hostname: u.hostname,
      port: u.port || (u.protocol === 'https:' ? 443 : 80),
      path: u.pathname + u.search,
      method: options.method || 'GET',
      timeout: options.timeout || 6000,
      rejectUnauthorized: false,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36',
        'Accept': 'application/json, text/plain, */*',
        'Origin': u.origin,
        'Referer': u.origin + '/',
        ...(options.headers || {})
      }
    };

    const req = lib.request(reqOpts, (res) => {
      let data = '';
      res.on('data', chunk => { data += chunk.toString('utf8'); });
      res.on('end', () => {
        let json = null;
        try { json = JSON.parse(data); } catch (e) {}
        resolve({
          status: res.statusCode,
          headers: res.headers,
          text: data,
          json
        });
      });
    });

    req.on('timeout', () => {
      req.destroy(new Error('ETIMEDOUT'));
    });
    req.on('error', reject);

    if (options.body) {
      req.write(options.body);
    }
    req.end();
  });
}

/**
 * Attempt real login + fetch open class sections (w-locdsnhomto) on AQTech / EdusoftWeb portals
 */
async function aqtechLoginAndFetch(schoolCode, username, password, clientId, customPortalUrl) {
  const school = SCHOOL_PORTALS[schoolCode] || SCHOOL_PORTALS.BDU;
  const baseUrl = (customPortalUrl || school.url).replace(/\/+$/, '');

  // Step 1: Authenticate via /public/api/auth/login (or /api/auth/login)
  const formBody = querystring.stringify({
    username: username.trim(),
    password: password,
    grant_type: 'password'
  });

  let loginRes = await rawHttpRequest(`${baseUrl}/public/api/auth/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Content-Length': Buffer.byteLength(formBody)
    },
    body: formBody
  });

  if (loginRes.status === 404) {
    loginRes = await rawHttpRequest(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Content-Length': Buffer.byteLength(formBody)
      },
      body: formBody
    });
  }

  if (!loginRes.json || !loginRes.json.access_token) {
    const errMsg = (loginRes.json && (loginRes.json.message || loginRes.json.error_description))
      || `HTTP ${loginRes.status} từ ${baseUrl}`;
    return {
      ok: false,
      portalUrl: baseUrl,
      reason: errMsg
    };
  }

  const token = loginRes.json.access_token;
  const studentName = loginRes.json.name || loginRes.json.principal || username;
  portalSessions.set(clientId, { schoolCode, baseUrl, token, studentName, username });

  // Step 2: Fetch filter conditions & open class sections (/public/api/dkmh/w-locdsnhomto)
  const nhomToPayload = JSON.stringify({
    is_CVHT: false,
    additional: {
      paging: { limit: 9999, page: 1 },
      ordering: [{ name: '', order_type: '' }]
    }
  });

  const nhomToRes = await rawHttpRequest(`${baseUrl}/public/api/dkmh/w-locdsnhomto`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(nhomToPayload)
    },
    body: nhomToPayload
  });

  if (nhomToRes.json && nhomToRes.json.data) {
    // Normalize ds_nhom_to with subject names from ds_mon_hoc if present
    const dataObj = nhomToRes.json.data;
    const monMap = {};
    if (Array.isArray(dataObj.ds_mon_hoc)) {
      for (const m of dataObj.ds_mon_hoc) {
        monMap[m.id] = m.ten || m.ma;
      }
    }
    if (Array.isArray(dataObj.ds_nhom_to)) {
      for (const item of dataObj.ds_nhom_to) {
        if (!item.ten_mon && item.id_mon && monMap[item.id_mon]) {
          item.ten_mon = monMap[item.id_mon];
        }
      }
    }
    return {
      ok: true,
      portalUrl: baseUrl,
      studentName,
      dataWeb: nhomToRes.json
    };
  }

  return {
    ok: true,
    portalUrl: baseUrl,
    studentName,
    dataWeb: { data: { ds_nhom_to: [] } }
  };
}

/**
 * Register or cancel a course section on a real AQTech / EdusoftWeb portal (/public/api/dkmh/w-xulydkmhsinhvien)
 */
async function aqtechRegisterOrCancel(clientId, idToHoc, isChecked = true) {
  const sess = portalSessions.get(clientId);
  if (!sess || !sess.token) {
    return { ok: false, reason: 'Chưa có phiên đăng nhập thực tế (đang ở chế độ Demo).' };
  }

  const payload = JSON.stringify({
    filter: {
      id_to_hoc: idToHoc,
      is_checked: isChecked,
      sv_nganh: 1
    }
  });

  const res = await rawHttpRequest(`${sess.baseUrl}/public/api/dkmh/w-xulydkmhsinhvien`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${sess.token}`,
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(payload)
    },
    body: payload
  });

  if (res.json && res.json.result && res.json.data && res.json.data.is_thanh_cong) {
    return { ok: true, data: res.json.data };
  }
  const err = (res.json && res.json.data && res.json.data.thong_bao_loi)
    || (res.json && res.json.message)
    || `HTTP ${res.status}`;
  return { ok: false, reason: err };
}

/**
 * Fetch registered courses on a real AQTech portal (/public/api/dkmh/w-locdskqdkmhsinhvien)
 */
async function aqtechFetchRegistered(clientId) {
  const sess = portalSessions.get(clientId);
  if (!sess || !sess.token) {
    return { ok: false };
  }

  const payload = JSON.stringify({
    is_CVHT: false,
    is_Clear: false
  });

  const res = await rawHttpRequest(`${sess.baseUrl}/public/api/dkmh/w-locdskqdkmhsinhvien`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${sess.token}`,
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(payload)
    },
    body: payload
  });

  if (res.json && res.json.data && Array.isArray(res.json.data.ds_kqdkmh)) {
    return {
      ok: true,
      list: res.json.data.ds_kqdkmh.map(item => ({
        id_to_hoc: item.to_hoc ? item.to_hoc.id_to_hoc : '',
        ma_mon: item.to_hoc ? item.to_hoc.ma_mon : '',
        ten_mon: item.to_hoc ? item.to_hoc.ten_mon : '',
        so_tc: item.to_hoc ? item.to_hoc.so_tc : '',
        tkb: item.to_hoc ? item.to_hoc.tkb : '',
        ngay_dk: item.ngay_dang_ky || ''
      }))
    };
  }
  return { ok: false };
}

/**
 * Attempt real PSC UIS portal request (e.g., dkmh.hcmute.edu.vn) with Cookie and AES-128-CBC encrypted CurriculumID
 */
async function pscSubmitRegistration(schoolCode, cookieStr, encryptedClasses) {
  const school = SCHOOL_PORTALS[schoolCode] || SCHOOL_PORTALS.HCMUTE;
  const baseUrl = school.url.replace(/\/+$/, '');
  const results = [];

  for (const item of encryptedClasses) {
    const body = querystring.stringify({
      CurriculumID: decodeURIComponent(item.Encrypt_maLHP || ''),
      maLHP: item.maLHP
    });
    try {
      const res = await rawHttpRequest(`${baseUrl}/Student/CourseRegistration/RegistConfirm`, {
        method: 'POST',
        headers: {
          'Cookie': cookieStr,
          'Content-Type': 'application/x-www-form-urlencoded',
          'X-Requested-With': 'XMLHttpRequest'
        },
        body
      });
      results.push({
        maLHP: item.maLHP,
        status: res.status,
        ok: res.status === 200 && !res.text.includes('Login'),
        snippet: res.text.slice(0, 140).replace(/<[^>]+>/g, ' ').trim()
      });
    } catch (err) {
      results.push({
        maLHP: item.maLHP,
        status: 0,
        ok: false,
        snippet: err.message
      });
    }
  }
  return { baseUrl, results };
}

module.exports = {
  SCHOOL_PORTALS,
  portalSessions,
  aqtechLoginAndFetch,
  aqtechRegisterOrCancel,
  aqtechFetchRegistered,
  pscSubmitRegistration
};
