pipeline {
    agent any

    environment {
        STACK_NAME = "mern-deployment-stack"
        INSTANCE_IP = ""
    }

    stages {
        stage('Trigger CloudFormation') {
            steps {
                script {
                    // Deploy the CloudFormation stack
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
                    // Retrieve the Public IP of the EC2 instance
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

        stage('Install Node.js and Dependencies') {
            steps {
                sshagent(['ssh-key-github-an6122003']) {
                    sh """
                    ssh -o StrictHostKeyChecking=no ec2-user@${INSTANCE_IP} << EOF
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

        stage('Health Check') {
            steps {
                sh """
                curl -f http://<INSTANCE_IP>:3000/healthcheck || exit 1
                """
            }
        }

        stage('MongoDB Health Check') {
            steps {
                sh """
                mongo --eval 'db.runCommand({ ping: 1 })' || exit 1
                """
            }
        }


        stage('Deploy MERN Server') {
            steps {
                sshagent(['ssh-key-github-an6122003']) { 
                    sh """
                    ssh -o StrictHostKeyChecking=no ec2-user@${INSTANCE_IP} << EOF
                    sudo docker pull your-docker-repo/mern-server:latest
                    sudo docker run -d --name mern-server -p 3000:3000 \
                        -e NODE_ENV=test \
                        -e MONGO_URI=mongodb://localhost:27017/rmit_ecommerce \
                        your-docker-repo/mern-server:latest
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
