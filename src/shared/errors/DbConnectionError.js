class DbConnectionError extends Error {
  constructor({ summary, cause, fixes = [], code, verbose, error }) {
    super(summary);
    this.name = 'DbConnectionError';
    this.summary = summary;
    this.cause = cause;
    this.fixes = fixes;
    this.code = code;
    this.verbose = verbose;
    this.originalError = error;
    this.isOperational = true;
  }

  static fromDiagnosis(diagnosis) {
    return new DbConnectionError({
      summary: diagnosis.summary,
      cause: diagnosis.cause,
      fixes: diagnosis.fixes,
      code: diagnosis.code,
      verbose: diagnosis.verbose,
      error: diagnosis.error,
    });
  }
}

module.exports = DbConnectionError;
