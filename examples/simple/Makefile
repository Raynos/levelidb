build:
	../../node_modules/.bin/browserify-server \
		--bundle=index.js -o ./static/bundle.js
server:
	../../node_modules/.bin/browserify-server \
		--server=./static --port=8081

live-reload:
	../../node_modules/.bin/live-reload

watch:
	../../node_modules/.bin/wr "make build" .

all:
	make live-reload &
	make server &
	make watch
