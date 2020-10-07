/*
 * Copyright (c) 2014 Cesanta Software Limited
 * All rights reserved
 */
#include <string>
#include <iostream>
#include <vector>
#include <math.h>
#include <stdio.h>
#include "mongoose.h"

#pragma warning(disable : 4996)


static sig_atomic_t s_signal_received = 0;
static const char *s_http_port = "8000";
static struct mg_serve_http_opts s_http_server_opts;
const float V = 0.03; // 0.12
const float EPS = 0.05;

static int s_done = 0;
static int s_is_connected = 0;

unsigned int FLAG_GO = 0;
struct state_go {
    mg_connection* c;
    std::pair<float, float> XZ0;
    std::pair<float, float> dX;
    std::pair<float, float> dZ;
    std::pair<float, float> XZn;
    float (*dist)(const struct state_go*);
};

float count_dist(const struct state_go* s)
{
    return sqrt(pow(s->XZn.first - s->XZ0.first, 2) + pow(s->XZn.second - s->XZ0.second, 2));
}

static void signal_handler(int sig_num) {
  signal(sig_num, signal_handler);  // Reinstantiate signal handler
  s_signal_received = sig_num;
}

static int is_websocket(const struct mg_connection *nc) {
  return nc->flags & MG_F_IS_WEBSOCKET;
}


struct state_go Sgo;

static void todo_togo(struct mg_connection *nc, const struct mg_str msg, struct state_go *Sgo) {
  struct mg_connection *c;
  char buf[64];
  char addr[32];
  mg_sock_addr_to_str(&nc->sa, addr, sizeof(addr),
                      MG_SOCK_STRINGIFY_IP | MG_SOCK_STRINGIFY_PORT);

  //snprintf(buf, sizeof(buf), "%s %.*s", addr, (int) msg.len, msg.p);
  //printf("%s\n", buf); /* Local echo. */
  //printf("%s\n", msg.p);
  const char* s = msg.p;
  int it = 0;
  //double* arr = new double(5);

  std::vector<float> arr;
  arr.push_back(0.0);
  arr.push_back(0.0);
  arr.push_back(0.0);
  arr.push_back(0.0);
  arr.push_back(0.0);
  arr.push_back(0.0);
  arr.push_back(0.0);
  arr.push_back(0.0);

  int j = 0, k = 1, i = 0, flag_negative = 1;
  float k1 = 1.0;

  for (i = 0; s[i] != '\0'; i++) {
      if (s[i] == '.') { 
          k = 0;
          continue;
      }
      
      if (s[i] == '-') {
          flag_negative = -1;
      }
      else if (s[i] == ' ') {
          arr[j] *= flag_negative;
          j++;
          flag_negative = 1;
          k1 = 1.0;
          k = 1;
      }
      else {
          if (k == 0) {
              k1 = k1 / 10;
              arr[j] = arr[j] + (s[i] - 48) * k1;
          }
          else {
              arr[j] = arr[j] * 10 + (s[i] - 48);
          }
      }
  }
  arr[j] *= flag_negative;
  // arr[0] = xx, arr[1] = zz, arr[2] = directionX, arr[3] = cos, arr[4] = directionZ, arr[5] = sin, arr[6] = move_toX, arr[7] = move_toZ
  //printf("%s\n", s);
  printf("%g %g %g %g %g %g %g %g\n", arr[0], arr[1], arr[2], arr[3], arr[4], arr[5], arr[6], arr[7]);

  /* END PARSE */
  /* WRITE DATA TO GO */
  
  std::pair<float, float> xz0(arr[0], arr[1]);
  std::pair<float, float> dx(arr[2], arr[3]);
  std::pair<float, float> dz(arr[4], arr[5]);
  std::pair<float, float> xzn(arr[6], arr[7]);
  *Sgo = { nc, xz0, dx, dz, xzn, count_dist };
  arr.clear();

  //float dist = sqrt(pow(arr[6] - arr[0], 2) + pow(arr[7] - arr[1], 2));
  //float newX, newZ;
  //float X_from = arr[0], Z_from = arr[1];
  //while (dist > EPS) {
  //    newX = arr[2] * arr[3] * V;
  //    newZ = arr[4] * arr[5] * V;
  //    snprintf(buf, sizeof(buf), "%g %g", newX, newZ);
  //    mg_send_websocket_frame(nc, WEBSOCKET_OP_TEXT, buf, strlen(buf));
  //    X_from += newX; Z_from += newZ;
  //    dist = sqrt(pow(arr[6] - X_from, 2) + pow(arr[7] - Z_from, 2));
  //    printf("%g %g %g\n", X_from, Z_from, dist);
  //   Sleep(16);
  //}
  // void mg_printf_websocket_frame(struct mg_connection *nc, int op_and_flags, const char* fmt, ...);
  //for (c = mg_next(nc->mgr, NULL); c != NULL; c = mg_next(nc->mgr, c)) {
  //    if (c == nc) { /* Don't send to the sender. */
          //mg_send_websocket_frame(nc, WEBSOCKET_OP_TEXT, buf, strlen(buf));
  //    }
  //}
}

static void server_handler(struct mg_connection* nc, int ev, void* p) {
    //(void)p;
    if (ev == MG_EV_RECV) {
        // Push received message to all ncections
        struct mbuf* io = &nc->recv_mbuf;
        //printf("%s\n", io->buf);
        //struct mg_connection* c;

        //for (c = mg_next(nc->mgr, NULL); c != NULL; c = mg_next(nc->mgr, c)) {
            //if (!(c->flags & MG_F_USER_2)) continue;  // Skip non-client connections
            //mg_send(c, io->buf, io->len);
        //}
        //mbuf_remove(io, io->len);
    }
    else if (ev == MG_EV_ACCEPT) {
        char addr[32];
        mg_sock_addr_to_str(&nc->sa, addr, sizeof(addr),
            MG_SOCK_STRINGIFY_IP | MG_SOCK_STRINGIFY_PORT);
        printf("New client connected from %s\n", addr);
    }
    else if (ev == MG_EV_HTTP_REQUEST) {
        mg_serve_http(nc, (struct http_message*)p, s_http_server_opts);
    }
}


static void ev1_handler(struct mg_connection *nc, int ev, void *ev_data) {
  switch (ev) {
    case MG_EV_WEBSOCKET_HANDSHAKE_DONE: {
      /* New websocket connection. Tell everybody. */
      //broadcast(nc, mg_mk_str("++ joined"));
        //char txt_hi[6] = "HELLO";
        //mg_send_websocket_frame(nc, WEBSOCKET_OP_TEXT, txt_hi, strlen(txt_hi));
        //struct mg_connection* c;
        //char addr[32];
        //for (c = mg_next(nc->mgr, NULL); c != NULL; c = mg_next(nc->mgr, c)) {
        //    mg_sock_addr_to_str(&c->sa, addr, sizeof(addr),
        //        MG_SOCK_STRINGIFY_IP | MG_SOCK_STRINGIFY_PORT);
        //    printf("%s\n", addr);
        //}
        break;
    }
    case MG_EV_WEBSOCKET_FRAME: {
      struct websocket_message *wm = (struct websocket_message *) ev_data;
      /* New websocket message. Tell everybody. */                                                   
      struct mg_str d = {(char *) wm->data, wm->size};
      FLAG_GO = 1;
      //struct state_go Sgo; 
      todo_togo(nc, d, &Sgo);
      
    }
    case MG_EV_POLL: {
        //char msg[16] = "1 1";
        //printf("%s\n", msg);
        if (FLAG_GO) {
            if ((Sgo.dist(&Sgo) > EPS)) {
                printf("%g %g %g\n", Sgo.XZ0.first, Sgo.XZ0.second, Sgo.dist(&Sgo));
                float newX = Sgo.dX.first * Sgo.dX.second * V;
                float newZ = Sgo.dZ.first * Sgo.dZ.second * V;
                Sgo.XZ0.first += newX; Sgo.XZ0.second += newZ;
                char buf[32];
                snprintf(buf, sizeof(buf), "%g %g", Sgo.XZ0.first, Sgo.XZ0.second);
                mg_send_websocket_frame(nc, WEBSOCKET_OP_TEXT, buf, strlen(buf));
                //mbuf_remove(&nc->send_mbuf, nc->send_mbuf.len);
                //printf("%s\n", nc->send_mbuf.buf);
                //dist = sqrt(pow(arr[6] - X_from, 2) + pow(arr[7] - Z_from, 2));
                //Sleep(16);
                //break;
            }
            else {
                printf("%g %g %g\n", Sgo.XZ0.first, Sgo.XZ0.second, Sgo.dist(&Sgo));
                FLAG_GO = 0;
            }
        }
        //mg_send_websocket_frame(nc, WEBSOCKET_OP_TEXT, msg, sizeof(msg));
        //Sleep(1000);
        //char msg1[16] = "-1 1";
        //mg_send_websocket_frame(nc, WEBSOCKET_OP_TEXT, msg1, sizeof(msg1));
        //Sleep(1000);
        //char msg2[16] = "1 -1";
        //mg_send_websocket_frame(nc, WEBSOCKET_OP_TEXT, msg2, sizeof(msg2));
        //Sleep(1000);
        break;
    }
    case MG_EV_HTTP_REQUEST: {
      mg_serve_http(nc, (struct http_message *) ev_data, s_http_server_opts);
      break;
    }
    case MG_EV_CLOSE: {
      /* Disconnect. Tell everybody. */
      if (is_websocket(nc)) {
        //broadcast(nc, mg_mk_str("-- left"));
      }
      break;
    }
  }
}


int main(void) {
  struct mg_mgr mgr;
  struct mg_connection *nc;

  signal(SIGTERM, signal_handler);
  signal(SIGINT, signal_handler);
  //setvbuf(stdout, NULL, _IOLBF, 0);
  //setvbuf(stderr, NULL, _IOLBF, 0);

  mg_mgr_init(&mgr, NULL);

  nc = mg_bind(&mgr, s_http_port, ev1_handler);
  mg_set_protocol_http_websocket(nc);
  s_http_server_opts.document_root = "./web";  // Serve current directory
  s_http_server_opts.enable_directory_listing = "yes";

  printf("Started on port %s\n", s_http_port);
  while (s_signal_received == 0) {
    mg_mgr_poll(&mgr, 100);
  }
  mg_mgr_free(&mgr);

  return 0;
}
