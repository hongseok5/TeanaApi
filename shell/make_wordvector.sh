PID="test"
PNAME1="tokenize"
PNAME2="word2vec"
NODE_HOME="/app/node/node-v10.16.3-linux-x64"
TA_HOME="/app/TeAna/TeAnaTextAnalytics-1.2.0"
API_HOME="/app/TeAna/TeAnaApi"
WORK_NAME="test"
if [[ -e ${API_HOME}/pid.txt ]]; then
 echo "if"
 WORK_NAME=`cat /app/TeAna/TeAnaApi/pid.txt | cut -d " " -f2`
 PID=`cat /app/TeAna/TeAnaApi/pid.txt | cut -d " " -f1`
 EXEC_CHECK=`ps -ef | grep -v "grep" | grep "${PID}" | wc -l`
 echo "${PID}"
 echo "${WORK_NAME}"
 echo "${EXEC_CHECK}"
 if [[ "${EXEC_CHECK}" -eq 1 ]]; then
  echo "wait"

 else
  echo "do nextjob"
  echo "${WORK_NAME}"
  if [[ "${WORK_NAME}" == "make_wdvct.js" ]]; then
   echo "check1"
   ${TA_HOME}/batch/TextAnalytics_auto.sh ${TA_HOME}/config/config.yaml wv_mobile_1 tokenize dynamic > /dev/null & 
   PID=`ps -ef | grep -v "grep" | grep tokenize | cut -d " " -f3` 
   WORK_NAME=" tokenize"
   echo "${PID}""${WORK_NAME}" > ${API_HOME}/pid.txt
   #MSG=`date " : make jbt"`
   #echo "${MSG}"
  elif [[ "${WORK_NAME}" == "tokenize" ]]; then
   echo "check2"
   ${TA_HOME}/batch/TextAnalytics_auto.sh ${TA_HOME}/config/config.yaml wv_mobile_1 word2vec dynamic > /dev/null &
   PID=`ps -ef | grep -v "grep" | grep word2vec | cut -d " " -f3`
   WORK_NAME=" word2vec"
   echo "${PID}""${WORK_NAME}" > ${API_HOME}/pid.txt
   echo " : tokenize"
  elif [[ "${WORK_NAME}" == "word2vec" ]]; then
   echo "check3"
   echo "word2vec"
   rm -f /app/TeAna/TeAnaApi/pid.txt
  else
   echo "Exception!!"
  fi
 fi

else
 echo "else" 
 ${NODE_HOME}/bin/node /app/TeAna/TeAnaApi/make_wdvct.js >> /app/TeAna/TeAnaApi/pid.txt &
fi 

