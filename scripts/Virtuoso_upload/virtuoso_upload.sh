#!/bin/bash
# ./virtuoso_upload.sh <dba password> <database path> <file1> ...
# Example: ./virtuoso_upload.sh dba_password /user/pmaillot/home/Programmes/docker-virtuoso/database file1.ttl file2.ttl

corese_version=4.5.0
corese_jar=corese-command-$corese_version.jar

if [ $# -le 2 ]; then
    echo "Expected arguments: $0 <dba password> <database path> <file1> ..."
    exit 0
fi

# Check if the virtuoso container is running
if [ ! "$(sudo docker ps -q -f name=virtuoso)" ]; then
    echo "The virtuoso container is not running"
    exit 1
fi

# Retrieve password from command line
DBA_PASSWORD=$1

# Retrieve database path from command line
database_path=$2

echo $database_path

# Retrieve file names from command line
nb_files=$(($#-2))
echo "Uploading $nb_files files"

# Iteration of the file list in the arguments
current_file_nb=1
while [ $current_file_nb -le $nb_files ] 
do
    current_file_nb=$(($current_file_nb + 2))
    filename=${@:$current_file_nb:1}

    echo "Uploading $filename"

    cp $filename $database_path
    baseFilename=$(basename $filename)
    sudo docker exec virtuoso isql -H localhost -U dba -P $DBA_PASSWORD exec="ld_dir('/database', '$baseFilename', '');"
done

echo "Loader run"
sudo docker exec virtuoso isql -H localhost -U dba -P $DBA_PASSWORD exec="rdf_loader_run();"  &
sudo docker exec virtuoso isql -H localhost -U dba -P $DBA_PASSWORD exec="rdf_loader_run();"  &
sudo docker exec virtuoso isql -H localhost -U dba -P $DBA_PASSWORD exec="rdf_loader_run();"  &
sudo docker exec virtuoso isql -H localhost -U dba -P $DBA_PASSWORD exec="rdf_loader_run();"  &
sudo docker exec virtuoso isql -H localhost -U dba -P $DBA_PASSWORD exec="rdf_loader_run();"  &
sudo docker exec virtuoso isql -H localhost -U dba -P $DBA_PASSWORD exec="rdf_loader_run();"  &
sudo docker exec virtuoso isql -H localhost -U dba -P $DBA_PASSWORD exec="rdf_loader_run();"  &
sudo docker exec virtuoso isql -H localhost -U dba -P $DBA_PASSWORD exec="rdf_loader_run();"  &
wait
echo "All loader finished"
sudo docker exec virtuoso isql -H localhost -U dba -P $DBA_PASSWORD exec="checkpoint;"


current_file_nb=1
while [ $current_file_nb -le $nb_files ] 
do
    current_file_nb=$(($current_file_nb + 2))
    filename=${@:$current_file_nb:1}
    baseFilename=$(basename $filename)
    rm $database_path$baseFilename
done