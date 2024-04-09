#!/bin/bash

corese_version=4.5.0
corese_jar=corese-command-$corese_version.jar

if [ ! -e $corese_jar ]; then
    wget -q https://github.com/Wimmics/corese/releases/download/release-$corese_version/$corese_jar
fi

rm -f rules/*

# Extraction of the class and property list
java -jar $corese_jar sparql -i vocabularies/* -o classList.csv -of csv -q ./classList.rq
java -jar $corese_jar sparql -i vocabularies/* -o propertyList.csv -of csv -q ./propertyList.rq

# Removing header from the csv files
echo "$(tail -n +2 classList.csv)" > classList.csv
echo "$(tail -n +2 propertyList.csv)" > propertyList.csv

entry_list=""

# Create the manifest for all the tests
manifest_file=_manifest.ttl
manifest_file_path=rules/$manifest_file
cat ./manifestTemplate.ttl > $manifest_file_path

# Create the test for each class and property
file_number=0
class_entry_definitions=""
while read class; do
    file_number=$((file_number+1))
    echo "Processing class $class to classTest$file_number.ttl"
    class_test_file=classTest$file_number.ttl
    class_test_file_path=rules/classTest$file_number.ttl
    # Create the test file
    cat ./classTestTemplate.ttl > $class_test_file_path
    replace "%%%CLASS%%%" "<$class>" -- $class_test_file_path 

    # Preparing the manifest content
    entry_list="$entry_list <$class_test_file>"
    class_manifest="$(cat classManifestEntryTemplate.ttl | replace "%%%CLASS%%%" "<$class>" | replace "%%%ENTRY%%%" "<$class_test_file>")"
    class_entry_definitions="$class_entry_definitions $class_manifest"
done < classList.csv

property_entry_definitions=""
while read property; do
    file_number=$((file_number+1))
    echo "Processing property $property to propertyTest$file_number.ttl"
    property_test_file=propertyTest$file_number.ttl
    property_test_file_path=rules/propertyTest$file_number.ttl
    cat ./propertyTestTemplate.ttl > $property_test_file_path
    replace "%%%PROPERTY%%%" "<$property>" -- $property_test_file_path

    # Preparing the manifest content
    entry_list="$entry_list <$property_test_file>"
    property_manifest="$(cat propertyManifestEntryTemplate.ttl | replace "%%%PROPERTY%%%" "<$property>" | replace "%%%ENTRY%%%" "<$property_test_file>")"
    property_entry_definitions="$property_entry_definitions $property_manifest"
done < propertyList.csv

# Replace the entry list in the manifest
replace "%%%ENTRY_LIST%%%" "$entry_list" -- $manifest_file_path
echo "$(cat $manifest_file_path) $class_entry_definitions" > $manifest_file_path
echo "$(cat $manifest_file_path) $property_entry_definitions" > $manifest_file_path

cp init.ttl rules/init.ttl