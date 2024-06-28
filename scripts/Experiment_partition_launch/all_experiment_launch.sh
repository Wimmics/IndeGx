#!/bin/bash



if [ $# -le 1 ]; then
    echo "Expected arguments: $0 <file1> ..."
    exit 0
fi


nb_files=$(($#-2))
echo "Launching $nb_files files"


current_file_nb=1
while [ $current_file_nb -le $nb_files ] 
do
    current_file_nb=$(($current_file_nb))
    template_filename=${@:$current_file_nb:1}

    ./Experiment_partition_launch.sh $template_filename
done