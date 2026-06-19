const ContactMysql = require('../../data/mysql/contact.mysql');
const { success } = require('../../shared/utils/response');
const AppError = require('../../shared/errors/AppError');

exports.submitContact = async (req, res) => {
  const message = await ContactMysql.createMessage(req.body);
  return success(res, message, 201);
};

exports.subscribe = async (req, res) => {
  try {
    const sub = await ContactMysql.subscribe(req.body.email);
    return success(res, sub, 201);
  } catch (err) {
    if (err.message === 'Already subscribed') throw AppError.conflict('Already subscribed');
    throw err;
  }
};

exports.listMessages = async (req, res) => {
  const messages = await ContactMysql.getMessages();
  return success(res, messages);
};

exports.updateMessageStatus = async (req, res) => {
  const msg = await ContactMysql.updateMessageStatus(req.params.id, req.body.status);
  return success(res, msg);
};
