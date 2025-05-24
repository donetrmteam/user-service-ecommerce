pipeline {
    agent any

    tools {
        nodejs 'NodeJS LTS'
    }

    environment {
        // Configurar variables de entorno para cada rama
        SERVER_DEV = 'IP'
        SERVER_QA = 'IP'
        SERVER_PROD = '44.214.199.75'
        DEPLOY_USER = 'ubuntu'
        APP_DIR = '/home/ubuntu/api-gateway'
        APP_REPO_URL = 'https://github.com/donetrmm/api-gateway.git'
    }

    stages {
        stage('Clone App Repo') {
            steps {
                script {
                    // Limpiar workspace por si hay restos
                    sh 'rm -rf app'
                    // Clonar el repo de la app según la rama
                    sh "git clone -b ${env.BRANCH_NAME} ${env.APP_REPO_URL} app"
                }
            }
        }

        stage('List Files') {
            steps {
                dir('app') {
                    sh 'ls -la'
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
                    def targetServer = ''
                    def targetBranch = env.BRANCH_NAME

                    // Determinar el servidor según la rama
                    if (targetBranch == 'dev') {
                        targetServer = env.SERVER_DEV
                    } else if (targetBranch == 'qa') {
                        targetServer = env.SERVER_QA
                    } else if (targetBranch == 'main') {
                        targetServer = env.SERVER_PROD
                    } else {
                        echo "No se desplegará la rama: ${targetBranch}"
                        return
                    }

                    withCredentials([sshUserPrivateKey(credentialsId: 'server-ssh-key', keyFileVariable: 'SSH_KEY')]) {
                        sh """
                            ssh -i ${SSH_KEY} -o StrictHostKeyChecking=no ${DEPLOY_USER}@${targetServer} '
                                # Actualizar repositorios
                                sudo apt update && sudo apt upgrade -y

                                # Instalar NVM si no existe
                                export NVM_DIR="\$HOME/.nvm"
                                if [ ! -d "\$NVM_DIR" ]; then
                                    echo "Instalando NVM..."
                                    curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.5/install.sh | bash
                                fi

                                # Cargar NVM
                                [ -s "\$NVM_DIR/nvm.sh" ] && \\. "\$NVM_DIR/nvm.sh"
                                [ -s "\$NVM_DIR/bash_completion" ] && \\. "\$NVM_DIR/bash_completion"

                                # Instalar Node LTS
                                echo "Instalando Node.js LTS..."
                                nvm install --lts
                                nvm use --lts

                                # Verificar versiones
                                node --version
                                npm --version

                                # Instalar PM2 globalmente
                                npm install -g pm2
                                pm2 --version

                                # Instalar Git si no está presente
                                if ! command -v git &> /dev/null; then
                                    sudo apt install -y git
                                fi

                                # Clonar o actualizar repositorio
                                if [ ! -d ${APP_DIR} ]; then
                                    echo "Clonando repositorio..."
                                    git clone -b ${targetBranch} ${env.APP_REPO_URL} ${APP_DIR}
                                else
                                    echo "Actualizando repositorio..."
                                    cd ${APP_DIR}
                                    git fetch --all
                                    git checkout ${targetBranch}
                                    git pull origin ${targetBranch}
                                fi

                                # Cargar NVM en el entorno de ejecución
                                export NVM_DIR="\$HOME/.nvm"
                                [ -s "\$NVM_DIR/nvm.sh" ] && \\. "\$NVM_DIR/nvm.sh"
                                nvm use --lts

                                # Instalar dependencias
                                cd ${APP_DIR}
                                npm ci

                                # Compilar la aplicación NestJS
                                if grep -q "\\\"build\\\"" package.json; then
                                    echo "Ejecutando build..."
                                    npm run build
                                else
                                    echo "No hay script de build en package.json, omitiendo este paso"
                                fi

                                # Reiniciar o iniciar con PM2
                                if pm2 list | grep -q "nest-app"; then
                                    echo "Reiniciando aplicación con PM2..."
                                    pm2 restart nest-app
                                else
                                    echo "Iniciando aplicación con PM2 por primera vez..."
                                    pm2 start dist/main.js --name "nest-app"
                                fi

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
            echo "Pipeline ejecutado con éxito!"
        }
        failure {
            echo "El pipeline ha fallado."
        }
    }
}