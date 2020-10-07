// Copyright (c) 2015 Cesanta Software Limited
// All rights reserved

#include "mongoose.h"
#include <iostream>

static const char* s_http_port = "8000";
static struct mg_serve_http_opts s_http_server_opts;

static void ev_handler(struct mg_connection* nc, int ev, void* p) {
    struct mbuf* io = &nc->recv_mbuf;
    switch (ev)
    {
        case MG_EV_ACCEPT:
        {
            // новое соединение - можем получить его дескриптор из conn->sock
            break;
        }
        case MG_EV_HTTP_REQUEST:
        {
            mg_serve_http(nc, (struct http_message*)p, s_http_server_opts);
            break;
        }
        case MG_EV_RECV:
        {
            // принято *(int *)p байт
            // This event handler implements simple TCP echo server
            //printf(io->buf);
            //mg_send(nc, io->buf, io->len);  // Echo received data back
            mbuf_remove(io, io->len);      // Discard data from recv buffer
            break;
        }
        case MG_EV_SEND:
        {
            // отправлено *(int *)ev_data байт
            break;
        }
        case MG_EV_CLOSE:
        {
            // соединение закрыто
            break;
        }
        default:
        {
            break;
        }
    }
}

int main(void) {
    struct mg_mgr mgr;
    struct mg_connection* nc;
    //cs_stat_t st;

    mg_mgr_init(&mgr, NULL);
    printf("Starting web server on port %s\n", s_http_port);
    nc = mg_bind(&mgr, s_http_port, ev_handler);
    if (nc == NULL) {
        printf("Failed to create listener\n");
        return 1;
    }

    // Set up HTTP server parameters
    mg_set_protocol_http_websocket(nc);
    s_http_server_opts.document_root = "./web";  // Serve current directory
    s_http_server_opts.enable_directory_listing = "yes";

    //if (mg_stat(s_http_server_opts.document_root, &st) != 0) {
    //    fprintf(stderr, "%s", "Cannot find web_root directory, exiting\n");
    //    exit(1);
    //}


    for (;;) {
        mg_mgr_poll(&mgr, 1000);
    }
    mg_mgr_free(&mgr);

    return 0;
}
// Запуск программы: CTRL+F5 или меню "Отладка" > "Запуск без отладки"
// Отладка программы: F5 или меню "Отладка" > "Запустить отладку"

// Советы по началу работы 
//   1. В окне обозревателя решений можно добавлять файлы и управлять ими.
//   2. В окне Team Explorer можно подключиться к системе управления версиями.
//   3. В окне "Выходные данные" можно просматривать выходные данные сборки и другие сообщения.
//   4. В окне "Список ошибок" можно просматривать ошибки.
//   5. Последовательно выберите пункты меню "Проект" > "Добавить новый элемент", чтобы создать файлы кода, или "Проект" > "Добавить существующий элемент", чтобы добавить в проект существующие файлы кода.
//   6. Чтобы снова открыть этот проект позже, выберите пункты меню "Файл" > "Открыть" > "Проект" и выберите SLN-файл.
