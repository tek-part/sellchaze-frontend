// How a recorded refund splits between gift cards and money (mirrors StoreOrderRefunds::split on
// the server, in integer cents). The refund summary sends: grand_total, gift_card_total,
// payment_collected, refunded_money, refunded_to_gift_cards, refundable_money, refundable_to_gift_cards.
//
// Rule: a refund's gift card share keeps the order's gift card / total ratio over everything given
// back so far (the last refund settles rounding); money never exceeds what money methods collected,
// and when money was never collected (cash on delivery returned undelivered) only the gift card
// part can go back. Cancellation restores the cards separately, which the summary already reflects.

const cents = (value) => {
    const number = Number(value);
    return Number.isFinite(number) ? Math.round(number * 100) : 0;
};

/** Whether anything can be refunded at all: money that was collected or gift card value not yet returned. */
export function refundValueAvailable(summary) {
    return Boolean(summary?.payment_collected) || cents(summary?.refundable_to_gift_cards) > 0;
}

/** Split `amountCents` of refund value (capped at what is refundable) into `{ giftCard, money }` cents. */
export function giftCardRefundSplit(summary, amountCents) {
    const grand = cents(summary?.grand_total);
    const total = Math.min(cents(summary?.gift_card_total), grand);
    const returned = cents(summary?.refunded_to_gift_cards);
    const cardLeft = cents(summary?.refundable_to_gift_cards);
    const moneyLeft = cents(summary?.refundable_money);
    const amount = Math.min(Math.max(0, Math.floor(Number(amountCents) || 0)), cardLeft + moneyLeft);
    let card = 0;
    if (cardLeft > 0) {
        const cap = Math.min(amount, cardLeft);
        if (!summary?.payment_collected) {
            card = cap;
        } else {
            const after = BigInt(cents(summary?.refunded_money) + returned + amount);
            const target = after >= BigInt(grand) ? total : Number((after * BigInt(total)) / BigInt(Math.max(1, grand)));
            card = Math.min(Math.max(0, target - returned), cap);
        }
    }
    let money = amount - card;
    if (money > moneyLeft) {
        card = Math.min(card + (money - moneyLeft), cardLeft);
        money = amount - card;
    }
    return { giftCard: card, money };
}
