// const { initializeApp } = require('firebase-admin/app');

import { initializeApp, cert, getApp, getApps } from "firebase-admin/app";

const fadminApp = getApps().length === 0 ? initializeApp({
    databaseURL: "https://altigenius4u-app-default-rtdb.asia-southeast1.firebasedatabase.app"
}) : getApp();

export default fadminApp;