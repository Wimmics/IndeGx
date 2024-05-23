#!/bin/bash

corese_version=4.5.0
corese_jar=corese-command-$corese_version.jar

# Upload to virtuoso
upload_file(){
    file=$1

    filename=`basename $file`
    echo "Uploading $filename"
    local_file=$file

    if echo $file | grep -q "http" 
    then
        echo "Downloading remote file $file"
        # Download the file
        curl -s -LO $file
        # Moving file in view of the virtuoso docker image
        mv $filename import/
    else
        echo "Copying local file $file"
        # Copying file in view of the virtuoso docker image
        cp $file import/$filename
    fi
    local_file=import/$filename

    # Named graph have to be created explicitely
    if [[ $filename == *.trig || $filename == *.nq ]]; then
        echo "$filename may contain named graphs that must be created explicitly"
        if [ ! -e $corese_jar ]; then
            wget -q https://github.com/Wimmics/corese/releases/download/release-$corese_version/$corese_jar
        fi

        # Listing the named graphs in the file
        echo "Listing the graphs in $filename"
        java -jar $corese_jar sparql -q named_graphs_list.rq -o named_graph_list.txt -of csv -i $local_file

        for graph in `cat named_graph_list.txt`
        do
            if [[ ! $graph == "graph" && ! $graph == "http://ns.inria.fr/corese/kgram/default" ]]; then
                echo "Creating graph $graph"
                sudo docker exec virtuoso isql -H localhost -U dba -P $DBA_PASSWORD exec="SPARQL CREATE GRAPH <$graph>;"
            fi
        done

        rm named_graph_list.txt
    fi

    sudo docker exec virtuoso isql -H localhost -U dba -P $DBA_PASSWORD exec="SPARQL LOAD <file:///database/$local_file>;"

    # cleanup
    rm import/$filename
}

if [ $# -le 1 ]; then
    echo "Expected arguments: $0 <dba password> <file1> ..."
    exit 0
fi

# Retrieve password from command line
DBA_PASSWORD=$1


# Retrieve file names from command line
nb_files=$(($#-1))
echo "Uploading $nb_files files"

current_file_nb=1
while [ $current_file_nb -le $nb_files ] 
do
    current_file_nb=$(($current_file_nb + 1))
    filename=${@:$current_file_nb:1}

    upload_file $filename
    
done

