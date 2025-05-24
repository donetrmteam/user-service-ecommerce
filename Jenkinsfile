pipeline {
    agent any

    tools {
        nodejs 'NodeJS LTS'
    }

    environment {
        EC2_SERVER = '54.235.214.15'  //Cambia la ip de la instancia EC2
        DEPLOY_USER = 'ubuntu'
        APP_DIR = '/home/ubuntu/user-service' //Cambia el directorio de la aplicación SEGUN EL NOMBRE DEL REPOSITORIO	
        APP_REPO_URL = 'https://github.com/donetrmm/user-service-ecommerce.git' //Cambia el url del repositorio SEGUN EL NOMBRE DEL REPOSITORIO
        PORT_DEV = '3001' //Cambia el puerto de la aplicación SEGUN EL NOMBRE DEL REPOSITORIO
        PORT_QA = '3002' //Cambia el puerto de la aplicación SEGUN EL NOMBRE DEL REPOSITORIO
        PORT_MAIN = '3003' //Cambia el puerto de la aplicación SEGUN EL NOMBRE DEL REPOSITORIO
    }

    stages {
        stage('Clone App Repo') {
            steps {
                script {
                    sh 'rm -rf app'
                    sh "git clone -b ${env.BRANCH_NAME} ${env.APP_REPO_URL} app"
                }
            }
        }

        stage('Install Dependencies') {
            steps {
                dir('app') {
                    sh 'npm ci'
                }
            }
        }

        stage('Deploy') {
            steps {
                script {
                    def targetPort = ''
                    def targetBranch = env.BRANCH_NAME

                    // Asignar puerto según la rama
                    if (targetBranch == 'dev') {
                        targetPort = env.PORT_DEV
                    } else if (targetBranch == 'qa') {
                        targetPort = env.PORT_QA
                    } else if (targetBranch == 'main') {
                        targetPort = env.PORT_MAIN
                    } else {
                        error "Rama no válida para despliegue: ${targetBranch}"
                    }

                    withCredentials([sshUserPrivateKey(credentialsId: 'server-ssh-key', keyFileVariable: 'SSH_KEY')]) {
                        sh """
                            ssh -i ${SSH_KEY} -o StrictHostKeyChecking=no ${DEPLOY_USER}@${EC2_SERVER} '
                                # Actualizar sistema
                                sudo apt update && sudo apt upgrade -y

                                # Instalar Nginx si no está presente
                                if ! command -v nginx &> /dev/null; then
                                    sudo apt install -y nginx
                                fi

                                # Instalar NVM
                                export NVM_DIR="\$HOME/.nvm"
                                if [ ! -d "\$NVM_DIR" ]; then
                                    curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.5/install.sh | bash
                                fi

                                # Cargar NVM
                                [ -s "\$NVM_DIR/nvm.sh" ] && \\. "\$NVM_DIR/nvm.sh"
                                [ -s "\$NVM_DIR/bash_completion" ] && \\. "\$NVM_DIR/bash_completion"

                                # Instalar Node LTS
                                nvm install --lts
                                nvm use --lts

                                # Instalar PM2
                                npm install -g pm2

                                # Preparar directorio para la rama
                                APP_BRANCH_DIR="${APP_DIR}-${targetBranch}"
                                if [ ! -d "\$APP_BRANCH_DIR" ]; then
                                    git clone -b ${targetBranch} ${env.APP_REPO_URL} \$APP_BRANCH_DIR
                                else
                                    cd \$APP_BRANCH_DIR
                                    git fetch --all
                                    git checkout ${targetBranch}
                                    git pull origin ${targetBranch}
                                fi

                                # Instalar dependencias y construir
                                cd \$APP_BRANCH_DIR
                                npm ci
                                npm run build

                                # Configurar variables de entorno
                                echo "PORT=${targetPort}" > .env

                                # Configurar y reiniciar PM2
                                pm2 delete "user-service-${targetBranch}" || true
                                pm2 start dist/main.js --name "user-service-${targetBranch}" --env production

                                # Configurar Nginx
                                sudo tee /etc/nginx/sites-available/user-service << EOF
server {
    listen 80;
    server_name _;

    # Configuración para dev
    location /dev/ {
        proxy_pass http://localhost:${PORT_DEV}/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \\\$http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host \\\$host;
    }

    # Configuración para qa
    location /qa/ {
        proxy_pass http://localhost:${PORT_QA}/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \\\$http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host \\\$host;
    }

    # Configuración para main (producción)
    location /prod/ {
        proxy_pass http://localhost:${PORT_MAIN}/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \\\$http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host \\\$host;
    }
}
EOF

                                # Activar la configuración de Nginx
                                sudo ln -sf /etc/nginx/sites-available/user-service /etc/nginx/sites-enabled/
                                sudo rm -f /etc/nginx/sites-enabled/default
                                sudo nginx -t && sudo systemctl restart nginx

                                # Guardar configuración de PM2
                                pm2 save
                            '
                        """
                    }
                }
            }
        }
    }

    post {
        success {
            echo "¡Despliegue exitoso! La aplicación está disponible en:"
            echo "DEV: http://${EC2_SERVER}/dev/"
            echo "QA: http://${EC2_SERVER}/qa/"
            echo "PROD: http://${EC2_SERVER}/prod/"
        }
        failure {
            echo "El despliegue ha fallado."
        }
    }
}