# Holistic set of indexing rules

Ths set of manifests in intended to create an indexation that uses all known indexing rules. This is intended to be used to add data to the [IndeGx SPARQL endpoint](http://prod-dekalog.inria.fr/sparql).

## Usage

It is strongly advised to use the [`Experiment_partition_launch.sh`](IndeGx/scripts/Experiment_partition_launch.sh) script to launch the experiment. This script will take care of the partitioning of the catalog of endpoints into parts of 20 endpoints and the launching of the indexing.

```bash
cd IndeGx/scripts/Experiment_partition_launch
sudo ./Experiment_partition_launch.sh
```

The results will appear as `.trig` files in the `IndeGx/output` folder.

## List of rules

- [X] [Legacy IndeGx rules](rules/IndeGx_original_rules/README.md)
- [ ] [Vocabulary statistics rules](rules/vocabulary_statistics/README.md)
- [ ] [Metavocabularies rules](rules/MetaVocabularies/README.md)
- [X] [FAIRness rules](rules/Fairness/README.md)
- [X] [Accountability rules](https://github.com/Jendersen/KG_accountability)
- [X] [Common Pitfalls rules](rules/CommonPitfalls/README.md)
- [ ] [Intention declaration for indexing](rules/intension/README.md)