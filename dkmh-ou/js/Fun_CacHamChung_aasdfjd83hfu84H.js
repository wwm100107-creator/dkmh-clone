// Shared helper module for University Portals (/dkmh-bdu, /dkmh-ou, /dkmh-sgu, etc.)
var running = 0;
var dem = 0;
var Act = 'login';
var DangchayAjax_ButtonOk = 0;
var DangchayAjax_ButtonLogin = 0;
var DangchayAjax_ButtonDKMH = 0;
var Rand = Math.floor(Math.random() * 900000) + 100000;
var Time = new Date().getTime();
var delay = 0;
var delay_busy = 1;
var delayHere = 0;
var delay_busyHere = 1;
var Data_locdsdieukienloc = null;
var Data_locdsnhomto = null;
var on_vip_code = 0; // Free unlimited VIP mode enabled by default
var ChonTypeLogin = 1;
var Type_Domain = 1;

$(document).ready(function() {
  // Inject Live Portal URL & School Info Banner above login inputs
  var schoolCode = window.CURRENT_SCHOOL_CODE || 'BDU';
  var schoolName = window.CURRENT_SCHOOL_NAME || 'Trường Đại học Bình Dương';
  var portalUrl = window.CURRENT_PORTAL_URL || 'https://daotao.bdu.edu.vn';
  var portalType = window.CURRENT_PORTAL_TYPE || 'AQTECH';

  var bannerHtml = '<div id="live-portal-banner" class="alert" style="background:#f0f7ff;border:1px solid #3c8dbc;color:#081828;margin-bottom:15px;border-radius:6px;">' +
    '<div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:8px;">' +
      '<div><b style="color:#0056b3;font-size:15px;"><i class="fa fa-university"></i> ' + schoolName + ' (' + schoolCode + ')</b> ' +
      '<span class="label label-primary">' + portalType + ' API</span> <span class="label label-success">VIP: FREE UNLIMITED</span></div>' +
      '<div style="font-size:12px;color:#555;">Trạng thái: <b>Live Portal Proxy + Smart Demo Fallback</b></div>' +
    '</div>' +
    '<div style="margin-top:8px;display:flex;align-items:center;gap:8px;flex-wrap:wrap;">' +
      '<label style="margin:0;font-size:12px;white-space:nowrap;">Cổng ĐKMH gốc của trường:</label>' +
      '<input type="text" id="custom_portal_url" class="form-control input-sm" style="max-width:340px;display:inline-block;height:28px;" value="' + portalUrl + '">' +
      '<span style="font-size:12px;color:#666;">(Tự động gửi xác thực thật tới cổng trường; nếu nhập tài khoản thử nghiệm sẽ chuyển sang chế độ Demo)</span>' +
    '</div>' +
  '</div>';

  var targetBox = $('#usernameTheme1').closest('.box-body');
  if (targetBox.length && !$('#live-portal-banner').length) {
    targetBox.prepend(bannerHtml);
  }

  // Intercept $.ajax calls to /api.php so schoolCode and customPortalUrl are always attached
  $(document).ajaxSend(function(event, jqxhr, settings) {
    if (settings.url && settings.url.indexOf('api.php') !== -1 && typeof settings.data === 'string') {
      var extra = '&school=' + encodeURIComponent(schoolCode) +
                  '&portalUrl=' + encodeURIComponent($('#custom_portal_url').val() || portalUrl);
      settings.data += extra;
    }
  });
});

function ok() {
  if (Act === 'dkmh' && $('.chk-nhom-to').length > 0) {
    DangKyNhomToSelected();
  } else {
    login();
  }
}

function check_vip_code() {
  return true;
}

function check_radio_button(name) {
  return $('input[name="' + name + '"]:checked').length > 0;
}

function XuLy_2Nut_Submit(state, text) {
  var btn1 = $('#ok, #submit_1, #btn_login');
  if (state === 'disabled') {
    btn1.attr('disabled', 'disabled').html('<i class="fa fa-spinner fa-spin"></i> ' + (text || 'Loading..'));
  } else {
    btn1.removeAttr('disabled').html('Submit');
  }
}

function show_html_input(html) {
  var target = $('#html_show_monhoc_body, #show_ds_nhom_to, #html_input');
  if (target.length && html) {
    target.first().html(html).show();
  }
}

function Table_ShowHide(tableId, btnPrefix, mode) {
  var el = $('#' + tableId);
  if (mode === 0) {
    el.show();
    $('#' + btnPrefix + '0').show();
    $('#' + btnPrefix + '1').hide();
  } else {
    el.hide();
    $('#' + btnPrefix + '0').hide();
    $('#' + btnPrefix + '1').show();
  }
}

function show_message_result(step, msgHtml) {
  if (!msgHtml) return;
  var box = $('#result, #show_result_log');
  if (box.length) {
    box.prepend('<div style="padding:6px 10px;border-bottom:1px dashed #ddd;"><b>#' + step + ':</b> ' + msgHtml + '</div>');
  }
}

function ChayShowDSNhomTo() {
  if (!Data_locdsnhomto || !Data_locdsnhomto.data || !Data_locdsnhomto.data.ds_nhom_to) return;
  Act = 'dkmh';
  var list = Data_locdsnhomto.data.ds_nhom_to;
  var html = '<div class="box box-info" style="margin-top:15px;"><div class="box-header with-border"><h3 class="box-title"><i class="fa fa-list-alt"></i> Danh sách Nhóm/Tổ học phần đang mở đăng ký (' + list.length + ' nhóm lớp)</h3></div><div class="box-body table-responsive"><table class="table table-bordered table-striped">' +
    '<thead><tr class="bg-primary"><th class="text-center">Chọn</th><th class="text-center">Trạng thái</th><th>Mã MH</th><th>Tên môn học</th><th class="text-center">Nhóm/Tổ</th><th class="text-center">STC</th><th>Thời khóa biểu & Phòng</th><th class="text-center">Còn lại</th></tr></thead><tbody>';
  for (var i = 0; i < list.length; i++) {
    var row = list[i];
    var checkedAttr = row.is_dk ? 'checked="checked"' : '';
    html += '<tr>' +
      '<td class="text-center"><input type="checkbox" class="chk-nhom-to" ' + checkedAttr + ' data-id="' + row.id_to_hoc + '" data-mamh="' + row.ma_mon + '" data-tenmh="' + (row.ten_mon || row.ma_mon) + '" data-stc="' + (row.so_tc || 3) + '" data-tkb="' + (row.tkb || '') + '"></td>' +
      '<td class="text-center">' + (row.ttMonHoc || '<span class="label label-success">Mở</span>') + '</td>' +
      '<td><b>' + row.ma_mon + '</b></td>' +
      '<td>' + (row.ten_mon || row.ma_mon) + '</td>' +
      '<td class="text-center">' + (row.nhom_to || row.lop || '01') + '</td>' +
      '<td class="text-center">' + (row.so_tc || 3) + '</td>' +
      '<td>' + (row.tkb || 'Thứ 2 (Tiết 1-3) - P.B204') + '</td>' +
      '<td class="text-center"><span class="label label-success">' + (row.sl_cl != null ? row.sl_cl : 12) + '</span></td>' +
      '</tr>';
  }
  html += '</tbody></table>' +
    '<button type="button" class="btn btn-success btn-lg" onclick="DangKyNhomToSelected()"><i class="fa fa-check-circle"></i> Đăng ký các lớp học phần đã chọn</button> ' +
    '<button type="button" class="btn btn-default" onclick="Act=\'login\'; $(\'#ds_nhom_to_box\').remove();"><i class="fa fa-refresh"></i> Đổi tài khoản khác</button>' +
    '</div></div>';

  $('#ds_nhom_to_box').remove();
  var container = $('<div id="ds_nhom_to_box"></div>').html(html);
  var formBox = $('#usernameTheme1').closest('.box-body');
  if (formBox.length) {
    formBox.append(container);
  } else {
    $('#result').before(container);
  }
}

function DangKyNhomToSelected() {
  var selected = [];
  $('.chk-nhom-to:checked').each(function() {
    selected.push({
      id_to_hoc: $(this).data('id'),
      ma_mon: $(this).data('mamh'),
      ten_mon: $(this).data('tenmh'),
      so_tc: $(this).data('stc'),
      tkb: $(this).data('tkb')
    });
  });
  if (selected.length === 0) {
    alert_swal_basic('error', 'Oops...', 'Vui lòng tích chọn ít nhất 1 lớp học phần trong bảng để đăng ký!', '');
    return;
  }
  XuLy_2Nut_Submit('disabled', 'Đang đăng ký..');
  $.ajax({
    url: '/api.php',
    type: 'POST',
    dataType: 'JSON',
    data: {
      action: 'dkmh',
      selected: JSON.stringify(selected),
      ClientId: Rand + '_' + Time,
      VIP_CODE: $('#vip_code').val()
    }
  }).success(function(res) {
    dem++;
    XuLy_2Nut_Submit('enable');
    if (res.message) alert_right_(res.message);
    if (res.message_noti) show_message_result(dem, res.message_noti);
    alert_swal_basic('success', 'Kết quả xử lý!', res.MessDoneAct || 'Đã xử lý đăng ký các lớp học phần đã chọn!', '');
    check_kqdk();
  }).error(function() {
    XuLy_2Nut_Submit('enable');
    alert_right_('Trang web đang quá tải :((');
  });
}

function check_kqdk() {
  $.ajax({
    url: '/api.php',
    type: 'POST',
    dataType: 'JSON',
    data: {
      action: 'xem_ket_qua',
      ClientId: Rand + '_' + Time,
      VIP_CODE: $('#vip_code').val()
    }
  }).success(function(res) {
    if (res.html) {
      var kqBox = $('#show_table_kqdh');
      if (kqBox.length) {
        kqBox.html(res.html).show();
        smoothScrollToBox('#show_table_kqdh');
      } else {
        $('#result').prepend(res.html);
      }
    }
    if (res.message) alert_right_(res.message);
  });
}

function HuyMonEdusoft(idToHoc) {
  $.ajax({
    url: '/api.php',
    type: 'POST',
    dataType: 'JSON',
    data: {
      action: 'huy_mon',
      id_to_hoc: idToHoc,
      ClientId: Rand + '_' + Time,
      VIP_CODE: $('#vip_code').val()
    }
  }).success(function(res) {
    if (res.message) alert_right_(res.message);
    if (res.message_noti) show_message_result(++dem, res.message_noti);
    check_kqdk();
  });
}

function stop() {
  running = 0;
  XuLy_2Nut_Submit('enable');
  $('input[name="ChonDomainDkmh"]').prop('disabled', false);
  alert_right_('[SwalAlert_Info] Đã dừng tiến trình tự động.');
}
