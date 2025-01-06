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

        stage('Install Dependencies and MongoDB') {
            steps {
                withCredentials([sshUserPrivateKey(credentialsId: 'ec2-ssh-vockey', keyFileVariable: 'SSH_KEY')]) {
                    sh """
                    ssh -i $SSH_KEY -o StrictHostKeyChecking=no ec2-user@${INSTANCE_IP} << EOF
                    sudo yum update -y
                    sudo yum install -y docker
                    sudo service docker start
                    sudo yum install -y nodejs npm
                    curl -fsSL https://deb.nodesource.com/setup_18.x | sudo bash -
                    sudo yum install -y mongodb-org
                    sudo systemctl start mongod
                    sudo systemctl enable mongod
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
