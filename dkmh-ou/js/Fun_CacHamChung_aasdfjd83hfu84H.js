// Reconstructed shared helper module for EdusoftWeb / AQTech university portals (/dkmh-bdu, /dkmh-ou, /dkmh-sgu, etc.)
var running = 0;
var DangchayAjax_ButtonLogin = 0;
var DangchayAjax_ButtonDKMH = 0;
var Rand = Math.floor(Math.random() * 900000) + 100000;
var Time = new Date().getTime();
var delay = 1;
var delay_busy = 2;
var Data_locdsdieukienloc = null;
var Data_locdsnhomto = null;
var on_vip_code = 0;
var ChonTypeLogin = 1;
var Type_Domain = 1;

function check_vip_code() {
  var val = $('#vip_code').val() || '';
  return val.trim().length > 0;
}

function check_radio_button(name) {
  return $('input[name="' + name + '"]:checked').length > 0;
}

function XuLy_2Nut_Submit(state, text) {
  var btn1 = $('#submit_1, #btn_login, button[onclick*="login()"]');
  if (state === 'disabled') {
    btn1.attr('disabled', 'disabled').html('<i class="fa fa-spinner fa-spin"></i> ' + (text || 'Loading..'));
  } else {
    btn1.removeAttr('disabled').html('<i class="fa fa-sign-in"></i> Đăng nhập / Tiếp tục');
  }
}

function show_message_result(step, msgHtml) {
  var box = $('#result, #show_result_log');
  if (box.length) {
    box.prepend('<div style="padding:6px 10px;border-bottom:1px dashed #ddd;"><b>#' + step + ':</b> ' + msgHtml + '</div>');
  }
}

function ChayShowDSNhomTo() {
  if (!Data_locdsnhomto || !Data_locdsnhomto.data || !Data_locdsnhomto.data.ds_nhom_to) return;
  var list = Data_locdsnhomto.data.ds_nhom_to;
  var html = '<div class="table-responsive" style="margin-top:15px;"><table class="table table-bordered table-striped">' +
    '<thead><tr class="bg-primary"><th>Chọn</th><th>Mã MH</th><th>Tên môn học</th><th>Nhóm/Tổ</th><th>STC</th><th>Lịch học</th><th>Còn lại</th></tr></thead><tbody>';
  for (var i = 0; i < list.length; i++) {
    var row = list[i];
    html += '<tr>' +
      '<td class="text-center"><input type="checkbox" class="chk-nhom-to" data-id="' + row.id_to_hoc + '" data-mamh="' + row.ma_mon + '" data-tenmh="' + row.ten_mon + '"></td>' +
      '<td><b>' + row.ma_mon + '</b></td>' +
      '<td>' + row.ten_mon + '</td>' +
      '<td>' + (row.nhom_to || '01') + '</td>' +
      '<td>' + (row.so_tc || 3) + '</td>' +
      '<td>' + (row.tkb || 'Thứ 2 (Tiết 1-3) - P.B204') + '</td>' +
      '<td><span class="label label-success">' + (row.sl_cl != null ? row.sl_cl : 12) + '</span></td>' +
      '</tr>';
  }
  html += '</tbody></table>' +
    '<button type="button" class="btn btn-success btn-lg" onclick="DangKyNhomToSelected()"><i class="fa fa-check-circle"></i> Đăng ký các lớp đã chọn</button>' +
    '</div>';
  var target = $('#html_show_monhoc_body, #show_ds_nhom_to, #result');
  if (target.length) {
    target.first().html(html);
  }
}

function DangKyNhomToSelected() {
  var selected = [];
  $('.chk-nhom-to:checked').each(function() {
    selected.push({
      id_to_hoc: $(this).data('id'),
      ma_mon: $(this).data('mamh'),
      ten_mon: $(this).data('tenmh')
    });
  });
  if (selected.length === 0) {
    alert_swal_basic('error', 'Oops...', 'Vui lòng tích chọn ít nhất 1 lớp học phần để đăng ký!', '');
    return;
  }
  $.ajax({
    url: 'api.php',
    type: 'POST',
    dataType: 'JSON',
    data: {
      action: 'dkmh',
      selected: JSON.stringify(selected),
      ClientId: Rand + '_' + Time,
      VIP_CODE: $('#vip_code').val()
    }
  }).success(function(res) {
    if (res.message) alert_right_(res.message);
    if (res.message_noti) show_message_result(1, res.message_noti);
    alert_swal_basic('success', 'Hoàn tất đăng ký!', res.MessDoneAct || 'Đã đăng ký thành công các lớp học phần đã chọn!', '');
  });
}

function stop() {
  running = 0;
  XuLy_2Nut_Submit('enable');
  alert_right_('[SwalAlert_Info] Đã dừng tiến trình tự động.');
}
