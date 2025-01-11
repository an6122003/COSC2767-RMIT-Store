pipeline {
    agent any

    environment {
        STACK_NAME = "test-env-mern-deployment-stack"
        INSTANCE_IP = ""
    }

    stages {
        stage('Trigger CloudFormation') {
            steps {
                script {
                    sh """
                    aws cloudformation deploy \
                        --stack-name ${STACK_NAME} \
                        --template-file cloudformation/create-test-server-template.yaml \
                        --capabilities CAPABILITY_NAMED_IAM
                    """
                }
            }
        }

        stage('Retrieve Instance IP') {
            steps {
                script {
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
                    ssh -i $SSH_KEY -o StrictHostKeyChecking=no ec2-user@${INSTANCE_IP} << EOF
                    echo "Starting: Update system packages"
                    sudo yum update -y
                    echo "Complete: Update system packages"

                    echo "Starting: Install Docker"
                    sudo yum install -y docker
                    sudo service docker start
                    echo "Complete: Install Docker"

                    echo "Starting: Install Node.js"
                    # Add NodeSource repository for the desired Node.js version
                    curl -o- https://raw.githubusercontent.com/creationix/nvm/v0.32.0/install.sh | bash
                    export NVM_DIR="/home/ec2-user/.nvm"
                    [ -s "$NVM_DIR/nvm.sh" ] && . "$NVM_DIR/nvm.sh"
                    nvm install --lts
                    echo "Complete: Install Node.js"

                    echo "Starting: Verify Node.js installation"
                    node -e "console.log('Running Node.js ' + process.version)"
                    echo "Complete: Verify Node.js installation"

                    echo "Starting: Verify npm installation"
                    npm -v
                    echo "Complete: Verify npm installation"

                    echo "Install Dependencies Successfully"
                    EOF
                    """
                }
            }
        }




        stage('Install MongoDB') {
            steps {
                withCredentials([sshUserPrivateKey(credentialsId: 'ec2-ssh-vockey', keyFileVariable: 'SSH_KEY')]) {
                    sh """
                    ssh -i $SSH_KEY -o StrictHostKeyChecking=no ec2-user@${INSTANCE_IP} << EOF
                    # Add the MongoDB repository
                    sudo tee /etc/yum.repos.d/mongodb-org-6.0.repo << "
                    [mongodb-org-6.0]
                    name=MongoDB Repository
                    baseurl=https://repo.mongodb.org/yum/amazon/2023/mongodb-org/6.0/x86_64/
                    gpgcheck=1
                    enabled=1
                    gpgkey=https://www.mongodb.org/static/pgp/server-6.0.asc
                    "

                    # Install and Start MongoDB 
                    sudo yum install -y mongodb-org
                    sudo systemctl start mongod
                    sudo systemctl enable mongod
                    mongod --version
                    echo "Install MongoDB Successfully"
                    EOF
                    """
                }
            }
        }

        stage('Deploy and Seed MongoDB') {
            steps {
                withCredentials([sshUserPrivateKey(credentialsId: 'ec2-ssh-vockey', keyFileVariable: 'SSH_KEY')]) {
                    sh """
                    ssh -i $SSH_KEY -o StrictHostKeyChecking=no ec2-user@${INSTANCE_IP} << EOF
                    sudo docker pull an6122003/mern-server:latest

                    # Run a temporary container to seed the database
                    sudo docker run --rm \
                        -e NODE_ENV=test \
                        -e MONGO_URI=mongodb://localhost:27017/rmit_ecommerce \
                        an6122003/mern-server:latest \
                        npm --prefix ./server run seed:db admin@rmit.edu.vn mypassword

                    # Run the application container
                    sudo docker run -d --name mern-server -p 3000:3000 \
                        -e NODE_ENV=test \
                        -e MONGO_URI=mongodb://localhost:27017/rmit_ecommerce \
                        an6122003/mern-server:latest

                    echo "Deploy and Seed MongoDB Successfully"
                    EOF
                    """
                }
            }
        }

        stage('Health Check') {
            steps {
                withCredentials([sshUserPrivateKey(credentialsId: 'ec2-ssh-vockey', keyFileVariable: 'SSH_KEY')]) {
                    sh """
                    ssh -i $SSH_KEY -o StrictHostKeyChecking=no ec2-user@${INSTANCE_IP} << EOF
                    curl -f http://localhost:3000/healthcheck || exit 1
                    EOF
                    """
                }
            }
        }

        stage('MongoDB Health Check') {
            steps {
                withCredentials([sshUserPrivateKey(credentialsId: 'ec2-ssh-vockey', keyFileVariable: 'SSH_KEY')]) {
                    sh """
                    ssh -i $SSH_KEY -o StrictHostKeyChecking=no ec2-user@${INSTANCE_IP} << EOF
                    mongo --eval 'db.runCommand({ ping: 1 })' || exit 1
                    EOF
                    """
                }
            }
        }
    }

    post {
        always {
            echo 'Pipeline completed.'
        }
        failure {
            echo 'Pipeline failed!'
        }
    }
}
