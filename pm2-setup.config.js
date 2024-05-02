export default {
    apps: [
        {
            name: 'AG4U-Backend',
            script: 'bun start',
            instances: 2,
            exec_mode: 'cluster',
            watch: true,
            increment_var: 'PORT',
            env: {
                NODE_ENV: 'production',
                PORT: 3000,
                GOOGLE_APPLICATION_CREDENTIALS: "~/google-services.json"
            },
        }
    ]
}