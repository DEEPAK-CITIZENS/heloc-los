import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  return {
    plugins: [react()],
    server: {
      port: 5174,
      proxy: {
        '/api': {
          target: 'http://localhost:9090',
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/api/, '/heloc-application-service/1.0')
        },
        '/appraisal-api': {
          target: 'http://localhost:9095',
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/appraisal-api/, '/property-appraisal-service/1.0')
        },
        '/portfolio-api': {
          target: 'http://localhost:9097',
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/portfolio-api/, '/heloc-portfolio-analytics-service/1.0')
        },
        '/esign-api': {
          target: 'http://localhost:9098',
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/esign-api/, '/heloc-esign-service/1.0')
        },
        '/ofac-api': {
          target: 'http://localhost:9096',
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/ofac-api/, '/ofac-screening-service/1.0')
        },
        '/preapproval-api': {
          target: 'http://localhost:9099',
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/preapproval-api/, '/heloc-pre-approval-service/1.0')
        },
        '/lien-api': {
          target: 'http://localhost:9094',
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/lien-api/, '/lien-recording-service/1.0')
        },
      }
    }
  }
})
