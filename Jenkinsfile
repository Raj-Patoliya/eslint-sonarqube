pipeline {
    agent any
    environment {
        SONARQUBE = credentials('creds_sonarqube')
    }
    stages {
        stage("Node"){
            steps{
                nodejs(nodeJSInstallationName: 'node20') {
                    sh """ 
                        npm install
                        npm run lint-report || true
                        jq -c '{
                            "issues":[
                                .[] | .filePath as \$path | .messages[] | {
                                        "engineId": "eslint_repo",
                                        "ruleId": .ruleId,
                                        "severity": "BLOCKER",
                                        "type": "VULNERABILITY",
                                        "primaryLocation": {
                                        "message": .message,
                                        "filePath": \$path,
                                        "textRange": {
                                            "startLine": .line,
                                            "endLine": .endLine,
                                            "startColumn": .column,
                                            "endColumn": .endColumn
                                        }
                                        }
                                    }
                            ]}' eslint_report.json > externalIssuesReport.json
                            rm eslint_report.json
                    """
                }
            }
        }
        stage('Code Quality Check via SonarQube') {
            steps {
                script {
                    nodejs(nodeJSInstallationName: 'node20') {
                        def scannerHome = tool 'sonarqube';
                        withSonarQubeEnv("sonarqubeserver") {
                            sh "${tool("sonarqube")}/bin/sonar-scanner \
                               -Dsonar.projectKey=eslint-security-testing-one \
                               -Dsonar.sources=. \
                               -Dsonar.externalIssuesReportPaths='externalIssuesReport.json'\
                               -Dsonar.css.node=."
                        }
                    }
                    sh """
                        #!/bin/bash
                        ceTaskUrl=\$(grep 'ceTaskUrl=' .scannerwork/report-task.txt | sed 's/ceTaskUrl=//')
                        # Check if ceTaskUrl is not empty
                        if [ -n "\$ceTaskUrl" ]; then
                            echo "Sending a curl request to ceTaskUrl: \$ceTaskUrl"
                            echo "------------------------------------------------------------------------"
                            analysisId=\$(curl -H "Authorization: Bearer \$SONARQUBE" "\$ceTaskUrl" | jq -r .task.analysisId)
                            while true
                            do
                                analysisId=\$(curl -H "Authorization: Bearer \$SONARQUBE" "\$ceTaskUrl" | jq -r .task.analysisId)
                                if [ "\$analysisId" != "null" ]; then
                                    break
                                fi
                                sleep 10;
                            done
                            analysisId=\$(echo "\$analysisId" | tr -d '"')
                            Status=\$(curl -H "Authorization: Bearer \$SONARQUBE" "http://192.168.40.11:9000/api/qualitygates/project_status?analysisId=\$analysisId" | jq .projectStatus.status)
                        else
                            echo "ceTaskUrl not found in the text file."
                        fi
                        if [ "\$Status" != '"OK"' ]; then
                            echo "Quality gates fail"
                            exit 1
                        else
                            echo "Quality gates Successfully passed"
                            exit 0
                        fi
                    """
                }
            }
        }
    }
}
