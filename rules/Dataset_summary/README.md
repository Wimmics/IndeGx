# Rules for the extraction of dataset summaries

For each dataset
    - [x] Basic statistics (triples, classes, properties, datatypes, distinctSubjects, distinctObjects)
    - [x] Classes
        - [x] Number of instances
        - [x] Properties around instances
            - [x] Number of instances of properties around class instances
            - Objects
                - [x] Datatypes
                    - [x] Min/max values
                - [x] Classes
                - [x] Number of different values
        - [ ] Cooccurrences around the same instance (class - classes)
    - Properties
        - [x] Number of triples
        - [ ] Cooccurrences around the same instance (property - properties)
    - [x] Datatypes
        -> Post-processing
        - [ ] Triples
            -> Post-processing
        - [ ] Number for values
    - [x] Associations (class - property - class/datatype)
    - [ ] Namespaces
        - [ ] Number of triples
        - [ ] Number of subjects
        - [ ] Number of objects
        - [ ] Number of properties
            - -> Post-processing
        - [ ] Number of classes
            - -> Post-processing
        - [ ] Associations (subject namespace - property - object namespace/object datatype)

qudt:lowerBound
qudt:upperBound
<http://qudt.org/schema/qudt>
## Result retrieval queries

TODO: Add queries