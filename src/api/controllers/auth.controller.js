const AuthServiceServer = require('../../domain/auth/AuthService.server');
const AdminMysql = require('../../data/mysql/admin.mysql');
const { success } = require('../../shared/utils/response');

exports.login = async (req, res) => {
  const result = await AuthServiceServer.loginAdmin(req.body.email, req.body.password);
  return success(res, result);
};

exports.me = async (req, res) => {
  const user = await AdminMysql.findById(req.admin.sub);
  return success(res, {
    id: user.id,
    email: user.email,
    fullName: user.full_name,
    permissions: user.permissions,
  });
};
