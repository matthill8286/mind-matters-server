# Mind-Matters

### Deployment

The best way to host this API is using a container-based platform. 

#### Recommended Hosting Services:
- **Render / Railway**: Very easy to set up. Connect your GitHub repository, and they will automatically detect the Dockerfile or use Node.js to deploy.
- **AWS App Runner / Google Cloud Run**: Great for scaling and reliable production environments.
- **DigitalOcean App Platform**: A simple way to deploy containerized apps.

#### Steps to Deploy:
1. **Containerize**: A `Dockerfile` and `.dockerignore` have been provided.
2. **Environment Variables**: Ensure you set the following in your hosting provider's dashboard:
   - `STRIPE_SECRET_KEY`
   - `OPENAI_API_KEY`
   - `PORT` (usually defaults to 8787 or is provided by the host)
3. **Domain & SSL**: Most modern hosts (Render, Railway, etc.) provide automatic SSL and a subdomain for your API.

#### Local Docker Build:
To test the container locally:
```bash
docker build -t mindmate-server .
docker run -p 8787:8787 --env-file .env mindmate-server
```
