import { DateTime } from "luxon";

export function parsePaymentKeyToDateTime(key: string) {
    return DateTime.fromFormat(key, "yyyy-MM");
}

export function createNextMonthPaymentKey() {
    const nextMonth = DateTime.now().plus({ month: 1 });

    return {
        serialized: nextMonth.toFormat("yyyy-MM"),
        dateTimeFmt: nextMonth,
    };
}

export function getPaymentStatusForThisMonth() {

    const paymentDate = DateTime.now()

    const nextPaymentDate = DateTime.fromObject({
        day: 23,
        month: DateTime.now().month,
        year: DateTime.now().year,
    });

    const diffDay = paymentDate.diff(nextPaymentDate, "days").toObject().days;

    const isFeeNextMonthAvailable = diffDay! >= 0;

    const isPaymentDue = diffDay! >= 7;

    return {
        diffDay,
        isFeeNextMonthAvailable,
        isPaymentDue
    }
}
