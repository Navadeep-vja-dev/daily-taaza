const AdminMessagesPage = {
  async init() {
    if (!AdminAuth.requireAuth()) return;
    AdminLayout.mount('messages', 'Contact messages', '<div class="admin-card"><div id="messages-table">Loading...</div></div>');
    await this.load();
  },

  async load() {
    const messages = await AdminApi.get('/admin/contact-messages');
    const statuses = ['new', 'read', 'resolved'];

    const rows = messages
      .map((m) => {
        const opts = statuses
          .map((s) => '<option value="' + s + '"' + (m.status === s ? ' selected' : '') + '>' + s + '</option>')
          .join('');
        return (
          '<tr><td>' +
          AdminLayout.escapeHtml(m.name) +
          '</td><td>' +
          AdminLayout.escapeHtml(m.email) +
          '</td><td>' +
          AdminLayout.escapeHtml((m.message || '').slice(0, 80)) +
          '</td><td><select data-msg="' +
          m.id +
          '">' +
          opts +
          '</select></td></tr>'
        );
      })
      .join('');

    document.getElementById('messages-table').innerHTML =
      '<table class="admin-table"><thead><tr><th>Name</th><th>Email</th><th>Message</th><th>Status</th></tr></thead><tbody>' +
      (rows || '<tr><td colspan="4">No messages yet</td></tr>') +
      '</tbody></table>';

    document.querySelectorAll('select[data-msg]').forEach((sel) => {
      sel.addEventListener('change', async () => {
        try {
          await AdminApi.put('/admin/contact-messages/' + sel.dataset.msg + '/status', { status: sel.value });
        } catch (err) {
          alert(err.message);
        }
      });
    });
  },
};

AdminMessagesPage.init();
