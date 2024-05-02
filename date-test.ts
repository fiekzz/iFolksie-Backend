import { DateTime } from "luxon";
import { createNextMonthPaymentKey, parsePaymentKeyToDateTime } from "./lib/controllers/payment/payment-helpers";

// const dt = DateTime.fromISO('2024-02-04')

// console.log(DateTime.now().toISODate());


// if (dt.isValid) {

//     console.log('Valid');
// }
// else {
//     console.log('Invalid');
// }

const todaysDate = DateTime.fromObject({ day: 3, month: 3, year: 2024 })

console.log(todaysDate);

const nextPaymentDate = DateTime.fromObject({ day: 23, month: DateTime.now().month, year: DateTime.now().year })

const diffDay = todaysDate.diff(nextPaymentDate, 'days').toObject().days

console.log(diffDay);

const isFeeNextMonthAvailable = diffDay! >= 0

const isPaymentDue = diffDay! >= 7

console.log(`Need to pay: ${isFeeNextMonthAvailable}\nDue: ${isPaymentDue}`);
