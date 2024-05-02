import registerAuthAPI from "./register";
import { oldUserRegisterAuthAPI } from "./register-old-user";
import { s2meUserPassword } from "./old-user-password";
import parentLoginAuthAPI from "./parent-login";
import teacherLoginAuthAPI from "./teacher-login";
import forgotPasswordAuthAPI from "./forgot-password";
import webLoginAPI from "./web/login";

export {
    parentLoginAuthAPI,
    teacherLoginAuthAPI,
    forgotPasswordAuthAPI,
    registerAuthAPI,
    oldUserRegisterAuthAPI,
    s2meUserPassword,
    webLoginAPI
}