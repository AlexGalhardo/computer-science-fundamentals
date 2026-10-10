package httpraw

import (
	"sort"
	"strings"
)

// Handler turns a request into a response.
type Handler func(req *Request) Response

type route struct {
	method   string
	segments []string
	handler  Handler
}

// Router chooses a handler from the method and the path of a request.
type Router struct {
	routes []route
}

// Handle registers a handler. A pattern segment that starts with ":" matches any one segment
// and stores it in Request.Params, as in "/hello/:name".
func (r *Router) Handle(method, pattern string, handler Handler) {
	r.routes = append(r.routes, route{method: method, segments: split(pattern), handler: handler})
}

func split(path string) []string {
	return strings.Split(strings.Trim(path, "/"), "/")
}

func match(pattern, path []string) (map[string]string, bool) {
	if len(pattern) != len(path) {
		return nil, false
	}
	params := map[string]string{}
	for i, segment := range pattern {
		switch {
		case strings.HasPrefix(segment, ":"):
			if path[i] == "" {
				return nil, false
			}
			params[segment[1:]] = path[i]
		case segment != path[i]:
			return nil, false
		}
	}
	return params, true
}

// Serve answers one request.
func (r *Router) Serve(req *Request) Response {
	// EN: Routing has two questions, and they give two different errors. Does any route know
	//     this PATH? If not: 404 Not Found. Does one of them accept this METHOD? If not:
	//     405 Method Not Allowed, with an Allow header listing the methods that would work.
	//     HEAD is answered by the GET handler: same headers, and the body is dropped later.
	// PT: O roteamento tem duas perguntas, e elas dão dois erros diferentes. Alguma rota conhece
	//     este CAMINHO? Se não: 404 Not Found. Alguma delas aceita este MÉTODO? Se não:
	//     405 Method Not Allowed, com um cabeçalho Allow listando os métodos que funcionariam.
	//     O HEAD é respondido pelo handler do GET: mesmos cabeçalhos, e o corpo é descartado
	//     depois.
	// ES: El enrutamiento tiene dos preguntas, y dan dos errores distintos. ¿Alguna ruta conoce
	//     esta RUTA? Si no: 404 Not Found. ¿Alguna acepta este MÉTODO? Si no:
	//     405 Method Not Allowed, con una cabecera Allow que lista los métodos que funcionarían.
	//     HEAD lo responde el handler de GET: mismas cabeceras, y el cuerpo se descarta después.
	path := split(req.Path)
	allowed := map[string]bool{}
	for _, candidate := range r.routes {
		params, ok := match(candidate.segments, path)
		if !ok {
			continue
		}
		if candidate.method == req.Method || (req.Method == "HEAD" && candidate.method == "GET") {
			req.Params = params
			return candidate.handler(req)
		}
		allowed[candidate.method] = true
		if candidate.method == "GET" {
			allowed["HEAD"] = true
		}
	}
	if len(allowed) == 0 {
		return Text(404, "no route for "+req.Path+"\n")
	}
	methods := make([]string, 0, len(allowed))
	for method := range allowed {
		methods = append(methods, method)
	}
	sort.Strings(methods)
	resp := Text(405, req.Method+" is not allowed on "+req.Path+"\n")
	resp.Header.Add("Allow", strings.Join(methods, ", "))
	return resp
}
