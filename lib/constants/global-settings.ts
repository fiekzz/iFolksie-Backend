const isProduction = process.env.NODE_ENV === 'production'

const settings = {
    contactEmail: 'altigenius4u@gmail.com',
    apiBaseUrl: isProduction ? 'https://api.ag4u.com.my' : 'https://dev-api.ag4u.com.my',
    websiteUrl: "https://ag4u.com.my",
    cdnUrl: 'https://cdn-prod.ag4u.com.my',
    redisUrl: 'redis://localhost:6379',
    tekkisUrl: isProduction ? 'https://tpay-api.tekkis.com.my' : 'https://api-staging.tpay.com.my',
    paymentRedirectUrl: 'https://ag4u.com.my',
    mediaBucketName: 'ag4u-prod',
}

export { settings }