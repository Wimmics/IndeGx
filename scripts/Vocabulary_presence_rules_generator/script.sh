#!/bin/bash

corese_version=4.5.0
corese_jar=corese-command-$corese_version.jar

if [ ! -e $corese_jar ]; then
    wget -q https://github.com/Wimmics/corese/releases/download/release-$corese_version/$corese_jar
fi

rm -rf rules/*
mkdir rules/main
mkdir rules/post

# Extraction of the namespace and property list
java -jar $corese_jar sparql -w -i lov_namespaces_18042024.ttl -o namespaceList.csv -of csv -q ./namespaceList.rq

# Removing header from the csv files
echo "$(tail -n +2 namespaceList.csv)" > namespaceList.csv

entry_list=""

# Create the manifest for all the tests
manifest_file=_manifest.ttl
post_manifest_file_path=rules/post/$manifest_file
main_manifest_file_path=rules/main/$manifest_file
cat ./postManifestTemplate.ttl > $post_manifest_file_path
cat ./mainManifestTemplate.ttl > $main_manifest_file_path

# Create the test for each namespace and property
file_number=0
namespace_entry_definitions=""
while read namespace; do
    file_number=$((file_number+1))
    namespace_test_file=namespaceTest$file_number.ttl
    echo "Processing namespace $namespace to $namespace_test_file..."
    namespace_test_file_path=rules/post/namespaceTest$file_number.ttl
    # Create the test file
    cat ./namespaceTestTemplate.ttl > $namespace_test_file_path
    replace "%%%namespace%%%" "<$namespace>" -- $namespace_test_file_path 

    # Preparing the manifest content
    entry_list="$entry_list <$namespace_test_file>"
    namespace_manifest="$(cat namespaceManifestEntryTemplate.ttl | replace "%%%namespace%%%" "<$namespace>" | replace "%%%ENTRY%%%" "<$namespace_test_file>")"
    namespace_entry_definitions="$namespace_entry_definitions $namespace_manifest"
done < namespaceList.csv

# Replace the entry list in the manifest
replace "%%%ENTRY_LIST%%%" "$entry_list" -- $post_manifest_file_path
echo "$(cat $post_manifest_file_path) $namespace_entry_definitions" > $post_manifest_file_path

cp init.ttl rules/main/init.ttl