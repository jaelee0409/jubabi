if (process.env.NODE_ENV === "development") {
  require("dotenv").config();
}

export const ENV = {
  get NODE_ENV() {
    return process.env.NODE_ENV;
  },
  get PORT() {
    return process.env.PORT;
  },
  get BACKEND_BASE_URL() {
    return process.env.BACKEND_BASE_URL;
  },
  get NEON_DATABASE_URL() {
    return process.env.NEON_DATABASE_URL;
  },
  get DART_API_KEY() {
    return process.env.DART_API_KEY;
  },
  get JWT_SECRET() {
    return process.env.JWT_SECRET;
  },
  get KAKAO_REST_API_KEY() {
    return process.env.KAKAO_REST_API_KEY;
  },
  get KAKAO_CLIENT_SECRET() {
    return process.env.KAKAO_CLIENT_SECRET;
  },
  get KAKAO_ADMIN_KEY() {
    return process.env.KAKAO_ADMIN_KEY;
  },
  get ANTHROPIC_API_KEY() {
    return process.env.ANTHROPIC_API_KEY;
  },
};
