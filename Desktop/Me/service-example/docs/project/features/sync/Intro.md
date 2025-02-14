## Sync feature

when this service is called it will behave depending on the operation type :

- ## ( biderctional operation ) :

  - The service will attemp to take the documents missing in each db and insert it into the other db ( INSERT ) .
  - The service will take the documents that have same \_id but with different properties ensure correct mapping and will update the value in each db by putting the latest document accross both db ( UPDATE ) .

- ## ( master-to-slave opertion ) :
  - The service will attemp to take the documents that are in the master and insert them into the slave db ( INSERT ) .
  - THe service will attemp to delete the documents that are in the slave and do not appear in the master and delete them ( DEL ) .
