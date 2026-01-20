# Jenkins → Argo CD → Kubernetes CI/CD Pipeline (GitOps)

## Overview

This repository documents a **production-grade end-to-end CI/CD pipeline** implemented using **Jenkins**, **Docker**, **AWS ECR**, **Kubernetes (kubeadm)**, and **Argo CD**. The pipeline follows **GitOps principles**, where Kubernetes manifests stored in Git are the single source of truth and Argo CD continuously reconciles cluster state.

This project is suitable for **real-world deployments, DevOps interviews, hackathons, and academic submissions**.

---

## Architecture

### High-Level Flow

```
Developer → GitHub (App Code)
        ↓
     Jenkins (CI)
        ├─ Build Docker Image
        ├─ Push Image to AWS ECR
        └─ Update Kubernetes Manifests
                    ↓
             GitHub (Manifests Repo)
                    ↓
               Argo CD (GitOps CD)
                    ↓
        Kubernetes Cluster (kubeadm)
```

---

## Technology Stack

* **Source Control**: GitHub
* **CI Tool**: Jenkins
* **Containerization**: Docker
* **Container Registry**: AWS Elastic Container Registry (ECR)
* **Orchestration**: Kubernetes (kubeadm)
* **CD / GitOps**: Argo CD
* **Runtime**: Node.js (Express)

---

## Repository Structure

```
jenkins-k8s-argocd/
 ├─ cicdapp/              # Application source code
 │   ├─ Dockerfile
 │   ├─ index.js
 │   ├─ package.json
 │
 └─ manifests/            # Kubernetes manifests (GitOps)
     └─ deployment.yaml
```

---

## CI/CD Responsibilities

### Jenkins (CI)

* Checkout application source code
* Build Docker image
* Authenticate with AWS ECR
* Push image to ECR
* Update Kubernetes manifests with new image tag

### Argo CD (CD)

* Installed **inside the Kubernetes cluster**
* Watches Git repository for manifest changes
* Automatically syncs Kubernetes resources
* Self-heals manual cluster drift

---

## Dockerfile (Multi-Stage Build)

```dockerfile
# Build stage
FROM node:18 AS builder
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm install
COPY . .

# Production stage
FROM node:18-alpine
WORKDIR /app
COPY --from=builder /app .
EXPOSE 3000
CMD ["node", "index.js"]
```

---

## Jenkins CI Pipeline

### Jenkinsfile

```groovy
pipeline {
    agent any

    environment {
        AWS_REGION = "ap-south-1"
        ECR_REPO   = "775412354718.dkr.ecr.ap-south-1.amazonaws.com/demo-app"
        IMAGE_TAG  = "${BUILD_NUMBER}"
    }

    stages {
        stage('Checkout Code') {
            steps {
                git branch: 'main',
                    url: 'git@github.com:vijay-devops-lab/jenkins-k8s-argocd.git',
                    credentialsId: 'git-ssh'
            }
        }

        stage('Build Docker Image') {
            steps {
                sh '''
                cd cicdapp
                docker build -t $ECR_REPO:$IMAGE_TAG .
                '''
            }
        }

        stage('Push Image to AWS ECR') {
            steps {
                withCredentials([[$class: 'AmazonWebServicesCredentialsBinding', credentialsId: 'aws-credentials-id']]) {
                    sh '''
                    aws ecr get-login-password --region $AWS_REGION | \
                    docker login --username AWS --password-stdin 775412354718.dkr.ecr.ap-south-1.amazonaws.com
                    docker push $ECR_REPO:$IMAGE_TAG
                    '''
                }
            }
        }

        stage('Update Kubernetes Manifests') {
            steps {
                sh '''
                cd manifests
                sed -i "s|image:.*|image: $ECR_REPO:$IMAGE_TAG|" deployment.yaml

                git config user.email "vijaypvk001@gmail.com"
                git config user.name "vijaypvk"

                git add deployment.yaml
                git commit -m "Update demo-app image to $IMAGE_TAG"
                git push origin main
                '''
            }
        }
    }
}
```

---

## Kubernetes Deployment Manifest

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: demo-app
spec:
  replicas: 2
  selector:
    matchLabels:
      app: demo-app
  template:
    metadata:
      labels:
        app: demo-app
    spec:
      imagePullSecrets:
        - name: ecr-secret
      containers:
        - name: demo-app
          image: 775412354718.dkr.ecr.ap-south-1.amazonaws.com/demo-app:latest
          ports:
            - containerPort: 3000
```

---

## AWS ECR Authentication (Kubernetes)

Create image pull secret:

```bash
kubectl create secret docker-registry ecr-secret \
  --docker-server=775412354718.dkr.ecr.ap-south-1.amazonaws.com \
  --docker-username=AWS \
  --docker-password=$(aws ecr get-login-password --region ap-south-1) \
  --docker-email=vijaypvk001@gmail.com
```

---

## Argo CD Setup

### Installation

```bash
kubectl create namespace argocd
kubectl apply -n argocd \
  -f https://raw.githubusercontent.com/argoproj/argo-cd/stable/manifests/install.yaml
```

### Application Configuration

* **Repository**: `jenkins-k8s-argocd`
* **Path**: `manifests/`
* **Sync Policy**: Automatic
* **Self-Heal**: Enabled

---

## Verification Commands

```bash
kubectl get pods
kubectl describe pod <pod-name>
kubectl logs <pod-name>

argocd app list
argocd app sync demo-app
```

---

## Common Issues & Troubleshooting

### Pod CrashLoopBackOff

**Cause**: Application crash or missing dependencies

```bash
kubectl logs <pod-name>
```

### ImagePullBackOff

**Cause**: Wrong image name or registry authentication issue

* Verify image exists in ECR
* Check `imagePullSecrets`

### Argo CD Not Syncing

**Cause**: Incorrect repo URL or manifest path

```bash
argocd app get demo-app
```

### Jenkins Build Failure

**Cause**: Docker permission issues

```bash
sudo usermod -aG docker jenkins
```

---

## Best Practices

* Never use `latest` tag in production
* Separate CI (Jenkins) and CD (Argo CD)
* Store Kubernetes manifests in Git
* Enable Argo CD auto-sync & self-heal
* Monitor logs and deployments continuously

---

## Conclusion

This project demonstrates a **robust GitOps-based CI/CD pipeline** using Jenkins and Argo CD on Kubernetes. It provides automated, auditable, and scalable deployments aligned with modern DevOps best practices.

---

### Author

**Vijay Krishnaa**
Aspiring DevOps Engineer
