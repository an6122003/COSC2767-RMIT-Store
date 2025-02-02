pipeline {
    agent any

    environment {
        STACK_NAME = "test-env-mern-deployment-stack"
        INSTANCE_IP = ""
    }

    parameters {
        string(name: 'image_tag', defaultValue: 'an6122003/mern-server:latest', description: 'Docker image tag to deploy')
    }

    stages {
        stage('Ensure Stack is Deleted Before Start') {
            steps {
                script {
                    echo "Checking for existing stack and ensuring deletion..."
                    def stackStatus = sh(
                        script: """
                            aws cloudformation describe-stacks --stack-name '${STACK_NAME}' --query "Stacks[0].StackStatus" --output text || echo "STACK_DOES_NOT_EXIST"
                        """,
                        returnStdout: true
                    ).trim()

                    if (stackStatus != "STACK_DOES_NOT_EXIST") {
                        echo "Stack exists with status: ${stackStatus}. Deleting stack..."
                        sh """
                            aws cloudformation delete-stack --stack-name ${STACK_NAME}
                            echo "Waiting for stack to delete..."
                            aws cloudformation wait stack-delete-complete --stack-name ${STACK_NAME}
                        """
                    } else {
                        echo "No existing stack found. Continue with the pipeline...."
                    }
                }
            }
        }


        stage('Trigger CloudFormation') {
            steps {
                script {
                    echo "Creating AWS Stack..."
                    sh """
                    aws cloudformation deploy \
                        --stack-name ${STACK_NAME} \
                        --template-file cloudformation/create-test-server-template.yaml \
                        --capabilities CAPABILITY_NAMED_IAM
                    """
                }
            }
        }

        stage('Wait for Instance') {
            steps {
                script {
                    echo "Waiting for 1 minute to ensure the server is ready..."
                    sh "sleep 60" 
                }
            }
        }

        stage('Retrieve Instance IP') {
            steps {
                script {
                    echo "Retrieving EC2 Instance IP..."
                    INSTANCE_IP = sh(
                        script: """
                        aws cloudformation describe-stacks \
                            --stack-name ${STACK_NAME} \
                            --query "Stacks[0].Outputs[?OutputKey=='PublicIP'].OutputValue" \
                            --output text
                        """,
                        returnStdout: true
                    ).trim()
                    echo "EC2 Instance IP: ${INSTANCE_IP}"
                }
            }
        }

        stage('Install Dependencies') {
            steps {
                withCredentials([sshUserPrivateKey(credentialsId: 'ec2-ssh-vockey', keyFileVariable: 'SSH_KEY')]) {
                    sh """
                    ssh -i $SSH_KEY -o StrictHostKeyChecking=no ec2-user@${INSTANCE_IP} "
                    echo "Starting: Update system packages"
                    sudo yum update -y
                    echo "Complete: Update system packages"

                    echo "Starting: Install Docker"
                    sudo yum install -y docker
                    sudo service docker start
                    echo "Complete: Install Docker"

                    echo "Starting: Install Node.js using nvm"
                    # Install nvm
                    curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.4/install.sh | bash

                    # Load nvm in this session
                    export NVM_DIR="/home/ec2-user/.nvm"
                    [ -s "/home/ec2-user/nvm.sh" ] && \\. "/home/ec2-user/nvm.sh"
                    [ -s "/home/ec2-user/bash_completion" ] && \\. "/home/ec2-user/bash_completion"

                    # Install and use the latest LTS version of Node.js
                    nvm install --lts
                    nvm use --lts
                    echo "Complete: Install Node.js using nvm"

                    echo "Starting: Verify Node.js installation"
                    node -v
                    echo "Complete: Verify Node.js installation"

                    echo "Starting: Verify npm installation"
                    npm -v
                    echo "Complete: Verify npm installation"

                    echo "Install Dependencies Successfully"
                    "
                    """
                }
            }
        }



        stage('Install MongoDB') {
            steps {
                withCredentials([sshUserPrivateKey(credentialsId: 'ec2-ssh-vockey', keyFileVariable: 'SSH_KEY')]) {
                    sh """
                    ssh -i $SSH_KEY -o StrictHostKeyChecking=no ec2-user@${INSTANCE_IP} "
                    # Add the MongoDB repository
                    echo '[mongodb-org-6.0]' | sudo tee /etc/yum.repos.d/mongodb-org-6.0.repo
                    echo 'name=MongoDB Repository' | sudo tee -a /etc/yum.repos.d/mongodb-org-6.0.repo
                    echo 'baseurl=https://repo.mongodb.org/yum/amazon/2023/mongodb-org/6.0/x86_64/' | sudo tee -a /etc/yum.repos.d/mongodb-org-6.0.repo
                    echo 'gpgcheck=1' | sudo tee -a /etc/yum.repos.d/mongodb-org-6.0.repo
                    echo 'enabled=1' | sudo tee -a /etc/yum.repos.d/mongodb-org-6.0.repo
                    echo 'gpgkey=https://www.mongodb.org/static/pgp/server-6.0.asc' | sudo tee -a /etc/yum.repos.d/mongodb-org-6.0.repo

                    # Install and Start MongoDB 
                    sudo yum install -y mongodb-org
                    sudo systemctl start mongod
                    sudo systemctl enable mongod
                    mongod --version
                    sudo yum remove -y mongodb-mongosh
                    sudo yum install -y mongodb-mongosh-shared-openssl3
                    sudo yum install -y mongodb-mongosh
                    echo 'Install MongoDB Successfully'
                    "
                    """
                }
            }
        }


        stage('Deploy and Seed MongoDB') {
            steps {
                withCredentials([sshUserPrivateKey(credentialsId: 'ec2-ssh-vockey', keyFileVariable: 'SSH_KEY')]) {
                    sh """
                    ssh -i $SSH_KEY -o StrictHostKeyChecking=no ec2-user@${INSTANCE_IP} "
                    echo 'Pulling the Docker image: ${image_tag}'
                    sudo docker pull ${image_tag}
                    echo "Image pulled successfully"

                    # Stop and remove any existing container named mern-server
                    sudo docker stop mern-server || true
                    sudo docker rm mern-server || true

                    # Run a temporary container to seed the database
                    sudo docker run --rm \
                        -e NODE_ENV=test \
                        -e MONGO_URI=mongodb://localhost:27017/rmit_ecommerce \
                        ${image_tag} \
                        npm run seed:db admin@rmit.edu.vn mypassword

                    # Run the application container
                    sudo docker run -d --name mern-server -p 3000:3000 \
                        -e NODE_ENV=test \
                        -e MONGO_URI=mongodb://localhost:27017/rmit_ecommerce \
                        ${image_tag}

                    echo "Deploy and Seed MongoDB Successfully"
                    "
                    """
                }
            }
        }

        stage('Health Check') {
            steps {
                withCredentials([sshUserPrivateKey(credentialsId: 'ec2-ssh-vockey', keyFileVariable: 'SSH_KEY')]) {
                    sh """
                    ssh -i $SSH_KEY -o StrictHostKeyChecking=no ec2-user@${INSTANCE_IP} "
                    echo 'Waiting for the server to be ready...'
                    sleep 10
                    echo 'Testing healthcheck endpoint'
                    curl -v -kf http://localhost:3000/healthcheck || (echo 'Healthcheck failed' && exit 1)
                    "
                    """
                }
            }
        }

        stage('MongoDB Health Check') {
            steps {
                withCredentials([sshUserPrivateKey(credentialsId: 'ec2-ssh-vockey', keyFileVariable: 'SSH_KEY')]) {
                    sh """
                    ssh -i $SSH_KEY -o StrictHostKeyChecking=no ec2-user@${INSTANCE_IP} "
                    mongosh --eval 'db.runCommand({ ping: 1 })' || (echo 'MongoDB ping failed' && exit 1)
                    "
                    """
                }
            }
        }
    }

    post {
        always {
            script {
                echo "Cleaning up. Deleting AWS stack..."
                sh """
                aws cloudformation delete-stack --stack-name ${STACK_NAME}
                aws cloudformation wait stack-delete-complete --stack-name ${STACK_NAME}
                """
            }
            echo 'Pipeline completed.'
        }
        failure {
            echo 'Pipeline failed!'
        }
    }
}
