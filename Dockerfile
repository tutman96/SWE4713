FROM node:6
WORKDIR /src
CMD npm start
ENV MYSQL_HOST mysql
EXPOSE 8080

ADD . /src
RUN cd /src && npm run update && npm run build && npm prune --prod && mkdir -p files/