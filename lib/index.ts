import { bootstrap } from "./app/bootstrap";
import { serve } from "@hono/node-server";
import { prisma } from "./app/prisma";
import {
    forgotPasswordAuthAPI,
    oldUserRegisterAuthAPI,
    parentLoginAuthAPI,
    registerAuthAPI,
    s2meUserPassword,
    teacherLoginAuthAPI,
    webLoginAPI,
} from "./controllers/auth";
import { getRuntimeKey } from "hono/adapter";
import { createPayment, paymentTest } from "./controllers/payment";
import { dailyLogsHandler } from "./controllers/dailylogs/upload";
import { cors } from "hono/cors";
import tekkisCallback from "./controllers/callback/tekkis-callback";
import allStudentsByBranch from "./controllers/shared/students/get-all-students-by-branch";
import getUserInfo from "./controllers/user/get-user-profile";
import uploadProfilePhoto from "./controllers/user/upload-profile-photo";
import getStudents from "./controllers/dailylogs/get-students";
import { memoriesListAPI } from "./controllers/portfolio/album-base-API";
import createMemoriesAPI from "./controllers/portfolio/upload";
import createStudentAPI from "./controllers/admin/students/create-student";
import studentByID from "./controllers/students/get-profile-by-id";
import getChildrenAPI from "./controllers/parents/get-children";
import overviewCard from "./controllers/parents/overview-card";
import checkInAndOut from "./controllers/parents/get-check-in-and-out";
import getChildrenMemories from "./controllers/parents/get-children-memories";
import deleteAccountAPI from "./controllers/web/delete-account";
import studentsWithParents from "./controllers/teachers/get-students-and-parents";
import getConversationList from "./controllers/conversation/get-conversation";
import checkOrCreateConversation from "./controllers/conversation/check-or-create-contact-conversation";
import checkConversationID from "./controllers/conversation/check-conversation-id";
import getMessagesAPI from "./controllers/chat/get-messages";
import getUpcomingPayments from "./controllers/payment/get-upcoming-payments";
import createFeePayment from "./controllers/payment/pay-fees";
import studentsWithTeachers from "./controllers/shared/parents/get-childs-teachers";
import paymentHistory from "./controllers/payment/get-payment-history";
import checkPayment from "./controllers/payment/check-payment-status";
import updateFCMToken from "./controllers/auth/update-fcm-token";
import listMediasWeb from "./controllers/web/media-management/list-medias";
import getApproval from "./controllers/web/media-management/get-approval";
import * as dotenv from "dotenv";
import getBranchDetails from "./controllers/teachers/get-branch-details";
import branchManagerCheckIn from "./controllers/teachers/branch-manager-checkin";
import editPortfolio from "./controllers/portfolio/edit-portfolio";
import infoPortfolio from "./controllers/portfolio/info-portfolio";
import uploadTagging from "./controllers/dailylogs/upload-tagging";
import studentUploadProfilePhoto from "./controllers/students/s-upload-profile-photo";
import deleteDiary from "./controllers/dailylogs/delete-diary";
import sendMessageAPI from "./controllers/chat/send-message";
import getDiaryDates from "./controllers/dailylogs/get-diary-dates";
import generateReceipt from "./controllers/payment/pdf/generate-receipt";
import createAlbum from "./controllers/portfolio/create-album";
import deletePortfolio from "./controllers/portfolio/delete-portfolio";
import getRole from "./controllers/user/get-role";
import getBranch from "./controllers/user/get-branch";
import createUser from "./controllers/user/create-user";
import getParentsWebAPI from "./controllers/web/api/get-parents";
import createStudentWebAPI from "./controllers/web/api/create-student";
import getBranchesWebAPI from "./controllers/web/api/get-branches";
import getClassesWebAPI from "./controllers/web/api/get-classes";
import checkInAndOutv2 from "./controllers/parents/get-check-in-and-outs-v2";
import checkOrCreateConversation2 from "./controllers/conversation/check-or-create-contact-conversation-v2";
import tStudentsWithParentsV2 from "./controllers/teachers/t-create-chat-get-students-and-parents";
import getUpcomingPaymentsV2 from "./controllers/payment/get-upcoming-payments-v2";
import paymentHistoryV2 from "./controllers/payment/get-payment-history-v2";
import getPaymentDetails from "./controllers/payment/get-payment-details";
import getChildrenMemoriesV2 from "./controllers/parents/get-children-memories-v2";
import getStudentsByBranch from "./controllers/shared/students/get-students-by-branch";
import getChildrenMemoriesV3 from "./controllers/parents/get-children-memories-v3";
import getUsersExperimental from "./controllers/web/api/get-users-experimental";
import teacherDiaryRejectedList from "./controllers/web/media-management/teacher-diary-rejected-list";
import v2GetPaymentDetails from "./controllers/payment/NewVersion/get-payment-details";
import insertPaymentData from "./controllers/payment/NewVersion/insert-payment-data";
import v2ProceedPayment from "./controllers/payment/NewVersion/proceed-payment";
import callbackTekkisV2 from "./controllers/payment/NewVersion/callback/callback-tekkis-v2"
import paymentStatus from "./controllers/payment/NewVersion/payment-status"
import getTransactionDetails from "./controllers/payment/NewVersion/get-transaction-details"
import teacherMemoriesRejectedList from "./controllers/web/media-management/teacher-memories-rejected-list"
import editProfileUser from "./controllers/web/edit-profile"
import teacherMemoriesRejectedList from "./controllers/web/media-management/teacher-memories-rejected-list";
import getAllConversations from "./controllers/web/admin/get-conversations";
import callbackTekkisV2 from "./controllers/payment/NewVersion/callback/callback-tekkis-v2";
import paymentStatus from "./controllers/payment/NewVersion/payment-status";
import getTransactionDetails from "./controllers/payment/NewVersion/get-transaction-details";

// import studentBmi from "./controllers/students/student-bmi";

dotenv.config();

const app = bootstrap();

// Auths
app.route("/v1/auth/fcm", updateFCMToken);

app.route("/v1/auth/parent/login", parentLoginAuthAPI);
app.route("/v1/auth/staff/login", teacherLoginAuthAPI);
app.route("/v1/auth/web/login", webLoginAPI);

app.route("/v1/auth/register", registerAuthAPI);

app.route("/v1/auth/forgot-password", forgotPasswordAuthAPI); // @ElyasAsmad TODO

app.route("/v1/auth/s2me-user-register", oldUserRegisterAuthAPI);
app.route("/v1/auth/s2me-reset-password", s2meUserPassword);

// Teacher modules
app.route("/v1/modules/teacher/all-students-by-branch", allStudentsByBranch);

app.route("/v1/modules/teacher/get-students-by-branch", getStudentsByBranch);
app.route("/v1/modules/teacher/chat/contacts", studentsWithParents);
app.route("/v2/modules/teacher/chat/contacts", tStudentsWithParentsV2);

app.route("/v1/modules/parent/chat/contacts", studentsWithTeachers);

// Parent modules
app.route("/v1/modules/parent/get-children", getChildrenAPI);
app.route("/v1/modules/parent/overview-card", overviewCard);

app.route("/v1/modules/parent/check-in-out", checkInAndOut);
app.route("/v2/modules/parent/check-in-out", checkInAndOutv2);

app.route("/v1/modules/parent/children-memories", getChildrenMemories);
app.route("/v2/modules/parent/children-memories", getChildrenMemoriesV2);
app.route("/v3/modules/parent/children-memories", getChildrenMemoriesV3);

app.route("/v4/web/delete-account", deleteAccountAPI);

// Daily Logs (Diary)
app.route("/v2/diary/get-students", getStudents); // ✅
app.route("/v2/diary", dailyLogsHandler); // ✅
app.route("/v1/diary/get-pending-logs", listMediasWeb);
app.route("/v1/diary/tag", uploadTagging);
// TODO TEST 19 Mar 2024
app.route("/v2/diary/get-dates", getDiaryDates);
// TODO TEST
app.route("/v2/diary/delete", deleteDiary);
// app.route("/v2/diary");

// Memories and Diary approval
app.route("/v2/web/get-approval", getApproval);

// Teacher diary rejected list
app.route("/v1/diary/teacher/rejected-list", teacherDiaryRejectedList);
// Teacher memories rejected list
app.route("/v1/memories/teacher/rejected-list", teacherMemoriesRejectedList);

// Payments
app.route("/v2/payments/details", getPaymentDetails);

app.route("/v2/payments/test", paymentTest);
app.route("/v2/payments/create", createPayment);
app.route("/v2/payments/callback", tekkisCallback);

app.route("/v2/payments/history", paymentHistory);
app.route("/v3/payments/history", paymentHistoryV2);

app.route("/v2/payments/status", checkPayment);
app.route("/v2/payments/generate-receipt", generateReceipt);

app.route("/v2/payments/upcoming", getUpcomingPayments);
app.route("/v3/payments/upcoming", getUpcomingPaymentsV2);

app.route("/v2/payments/pay", createFeePayment);

// Payments v5
app.route("/v5/payments/", v2GetPaymentDetails);
app.route("/v5/payments/proceed-payment", v2ProceedPayment);
app.route("/v5/payments/insert-payment-data", insertPaymentData);
// Payments v5 Callback
app.route("/v5/payments/callback", callbackTekkisV2);
app.route("/v5/payments/status", paymentStatus);
app.route("/v5/payments/transaction-details", getTransactionDetails);

// Messaging
app.route("/v5/conversations/create-or-check", checkOrCreateConversation);
app.route("/v6/conversations/create-or-check", checkOrCreateConversation2);

app.route("/v5/conversations/check-conversation-id", checkConversationID);
app.route("/v5/conversations", getConversationList);

app.route("/v5/messaging", sendMessageAPI);

// app.route('/v5/conversation', getMessagesAPI)

// Branch Manager Check In and Out
// KIV
app.route("/v5/branch/get-branch-details", getBranchDetails);
app.route("/v5/branch/check-in", branchManagerCheckIn);

//  Edit memories
app.route("/v3/memories/edit", editPortfolio);
app.route("/v3/memories/info", infoPortfolio);

// Portfolio (Memories)
app.route("/v3/memories/create", createMemoriesAPI); // ✅
app.route("/v3/memories", memoriesListAPI); // ✅
app.route("/v3/album/create-album", createAlbum);
app.route("/v3/album/delete-portfolio", deletePortfolio);

// Student Profile
app.route("/v3/students/get-profile", studentByID); // ✅
app.route("/v3/students/profile/upload", studentUploadProfilePhoto); // ✅
// app.route("/v3/students/student-bmi", studentBmi); // ✅

// Admin APIs
app.route("/v4/admin/students/create", createStudentAPI); // ✅

// User Profile
app.route("/v1/user/profile", getUserInfo);
app.route("/v1/user/profile/upload", uploadProfilePhoto);

app.route("/v3/role", getRole);
app.route("/v3/branch", getBranch);
app.route("/v3/create-user", createUser);

app.use(
    "/v1/web/*",
    cors({
        origin: ["*"],
    })
);

app.use(
    "/v1/web/*",
    cors({
        origin: ['*']
    })
)

// Web APIs
app.route("/v1/web/api/get-parents", getParentsWebAPI)
app.route("/v1/web/api/get-branches", getBranchesWebAPI)
app.route("/v1/web/api/get-classes", getClassesWebAPI)
app.route("/v1/web/api/experimental/get-users", getUsersExperimental)
app.route("/v1/web/edit-profile", editProfileUser)

app.route("/v1/web/api/create-student", createStudentWebAPI);

app.route("/v1/web/api/admin/user-conversations", getAllConversations);

app.post("/test", async (c) => {
    const body = await c.req.parseBody();

    console.log(body);
    return c.json({
        message: "OK",
        data: {},
        success: true,
    });
});

app.get("/", (c) =>
    c.json({ message: "AG4U", timestamp: new Date().toISOString() })
);

app.notFound((c) => {
    return c.html(
        "<h1>What are you trying to do <strong>STUPID script kiddie?</strong> Dumb kids only know how to use script instead of real hacking.</h1>",
        404
    );
});

process.on("exit", async () => {
    await prisma.$disconnect();
    console.log("✅ Disconnected from database");
});

export default {
    fetch: app.fetch,
    port: process.env.PORT || 3000,
};

// export default (() => {
//     if (getRuntimeKey() === "node") {
//         console.log("⚡ Serving on Node.js");
//         serve(app);
//         return;
//     }

//     if (getRuntimeKey() === 'bun') {
//         console.log("⚡ Serving on Bun");
//         return app
//     }

// })();
