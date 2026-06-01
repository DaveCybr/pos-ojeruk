export class AppError extends Error {
  constructor(public message: string, public statusCode: number = 500) {
    super(message)
    this.name = 'AppError'
  }
}

export class NotFoundError extends AppError {
  constructor(message = 'Data tidak ditemukan') { super(message, 404) }
}

export class ConflictError extends AppError {
  constructor(message = 'Data sudah ada') { super(message, 409) }
}

export class BadRequestError extends AppError {
  constructor(message = 'Request tidak valid') { super(message, 400) }
}
