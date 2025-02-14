up:
	echo "Starting the sever instance"
	docker compose up --build -d

logs:
	docker compose logs

restart:
	docker compose restart

stop:
	docker compose stop

down:
	docker compose down

cert:
	echo "Generating SSL certificates"
	cd ./ssl && sh instructions.sh

inject:
	wire ./pkg/injector/wire.go