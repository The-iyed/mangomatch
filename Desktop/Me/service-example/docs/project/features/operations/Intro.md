## Operations feature

developer will be able to create an operation :

- each operation will container the connection to each database ( mongoDB ) and the name of the collections that should be synchronized
- each operation should have its type ( biderctional / master-to-slave ) :
  - biderctional : both databases could affect each other , so the new update should be binded across the two databases
  - master-to-slave : one way update , so the slave db will read from the master and ensure consistency
- each operation will have the retry time delay
- each operation will have mapping :

  - so the developer will define the key for each document and its referring in the other db
  - the mapping will have same ( key - value ) pair by default

- each operation could have a filter for each collection so the developer can ensure consistency only in a portion of the db ( ALL ITEMS BY DEFAULT )
