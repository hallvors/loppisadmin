
(function(l, i, v, e) { v = l.createElement(i); v.async = 1; v.src = '//' + (location.host || 'localhost').split(':')[0] + ':35729/livereload.js?snipver=1'; e = l.getElementsByTagName(i)[0]; e.parentNode.insertBefore(v, e)})(document, 'script');
var app = (function () {
    'use strict';

    function noop() { }
    const identity = x => x;
    function assign(tar, src) {
        // @ts-ignore
        for (const k in src)
            tar[k] = src[k];
        return tar;
    }
    function is_promise(value) {
        return value && typeof value === 'object' && typeof value.then === 'function';
    }
    function add_location(element, file, line, column, char) {
        element.__svelte_meta = {
            loc: { file, line, column, char }
        };
    }
    function run(fn) {
        return fn();
    }
    function blank_object() {
        return Object.create(null);
    }
    function run_all(fns) {
        fns.forEach(run);
    }
    function is_function(thing) {
        return typeof thing === 'function';
    }
    function safe_not_equal(a, b) {
        return a != a ? b == b : a !== b || ((a && typeof a === 'object') || typeof a === 'function');
    }
    function validate_store(store, name) {
        if (!store || typeof store.subscribe !== 'function') {
            throw new Error(`'${name}' is not a store with a 'subscribe' method`);
        }
    }
    function subscribe(store, callback) {
        const unsub = store.subscribe(callback);
        return unsub.unsubscribe ? () => unsub.unsubscribe() : unsub;
    }
    function component_subscribe(component, store, callback) {
        component.$$.on_destroy.push(subscribe(store, callback));
    }
    function create_slot(definition, ctx, fn) {
        if (definition) {
            const slot_ctx = get_slot_context(definition, ctx, fn);
            return definition[0](slot_ctx);
        }
    }
    function get_slot_context(definition, ctx, fn) {
        return definition[1]
            ? assign({}, assign(ctx.$$scope.ctx, definition[1](fn ? fn(ctx) : {})))
            : ctx.$$scope.ctx;
    }
    function get_slot_changes(definition, ctx, changed, fn) {
        return definition[1]
            ? assign({}, assign(ctx.$$scope.changed || {}, definition[1](fn ? fn(changed) : {})))
            : ctx.$$scope.changed || {};
    }

    const is_client = typeof window !== 'undefined';
    let now = is_client
        ? () => window.performance.now()
        : () => Date.now();
    let raf = is_client ? cb => requestAnimationFrame(cb) : noop;

    const tasks = new Set();
    let running = false;
    function run_tasks() {
        tasks.forEach(task => {
            if (!task[0](now())) {
                tasks.delete(task);
                task[1]();
            }
        });
        running = tasks.size > 0;
        if (running)
            raf(run_tasks);
    }
    function loop(fn) {
        let task;
        if (!running) {
            running = true;
            raf(run_tasks);
        }
        return {
            promise: new Promise(fulfil => {
                tasks.add(task = [fn, fulfil]);
            }),
            abort() {
                tasks.delete(task);
            }
        };
    }

    function append(target, node) {
        target.appendChild(node);
    }
    function insert(target, node, anchor) {
        target.insertBefore(node, anchor || null);
    }
    function detach(node) {
        node.parentNode.removeChild(node);
    }
    function destroy_each(iterations, detaching) {
        for (let i = 0; i < iterations.length; i += 1) {
            if (iterations[i])
                iterations[i].d(detaching);
        }
    }
    function element(name) {
        return document.createElement(name);
    }
    function text(data) {
        return document.createTextNode(data);
    }
    function space() {
        return text(' ');
    }
    function empty() {
        return text('');
    }
    function listen(node, event, handler, options) {
        node.addEventListener(event, handler, options);
        return () => node.removeEventListener(event, handler, options);
    }
    function prevent_default(fn) {
        return function (event) {
            event.preventDefault();
            // @ts-ignore
            return fn.call(this, event);
        };
    }
    function stop_propagation(fn) {
        return function (event) {
            event.stopPropagation();
            // @ts-ignore
            return fn.call(this, event);
        };
    }
    function attr(node, attribute, value) {
        if (value == null)
            node.removeAttribute(attribute);
        else
            node.setAttribute(attribute, value);
    }
    function children(element) {
        return Array.from(element.childNodes);
    }
    function set_data(text, data) {
        data = '' + data;
        if (text.data !== data)
            text.data = data;
    }
    function set_style(node, key, value) {
        node.style.setProperty(key, value);
    }
    function select_option(select, value) {
        for (let i = 0; i < select.options.length; i += 1) {
            const option = select.options[i];
            if (option.__value === value) {
                option.selected = true;
                return;
            }
        }
    }
    function select_options(select, value) {
        for (let i = 0; i < select.options.length; i += 1) {
            const option = select.options[i];
            option.selected = ~value.indexOf(option.__value);
        }
    }
    function select_value(select) {
        const selected_option = select.querySelector(':checked') || select.options[0];
        return selected_option && selected_option.__value;
    }
    function select_multiple_value(select) {
        return [].map.call(select.querySelectorAll(':checked'), option => option.__value);
    }
    function toggle_class(element, name, toggle) {
        element.classList[toggle ? 'add' : 'remove'](name);
    }
    function custom_event(type, detail) {
        const e = document.createEvent('CustomEvent');
        e.initCustomEvent(type, false, false, detail);
        return e;
    }

    let stylesheet;
    let active = 0;
    let current_rules = {};
    // https://github.com/darkskyapp/string-hash/blob/master/index.js
    function hash(str) {
        let hash = 5381;
        let i = str.length;
        while (i--)
            hash = ((hash << 5) - hash) ^ str.charCodeAt(i);
        return hash >>> 0;
    }
    function create_rule(node, a, b, duration, delay, ease, fn, uid = 0) {
        const step = 16.666 / duration;
        let keyframes = '{\n';
        for (let p = 0; p <= 1; p += step) {
            const t = a + (b - a) * ease(p);
            keyframes += p * 100 + `%{${fn(t, 1 - t)}}\n`;
        }
        const rule = keyframes + `100% {${fn(b, 1 - b)}}\n}`;
        const name = `__svelte_${hash(rule)}_${uid}`;
        if (!current_rules[name]) {
            if (!stylesheet) {
                const style = element('style');
                document.head.appendChild(style);
                stylesheet = style.sheet;
            }
            current_rules[name] = true;
            stylesheet.insertRule(`@keyframes ${name} ${rule}`, stylesheet.cssRules.length);
        }
        const animation = node.style.animation || '';
        node.style.animation = `${animation ? `${animation}, ` : ``}${name} ${duration}ms linear ${delay}ms 1 both`;
        active += 1;
        return name;
    }
    function delete_rule(node, name) {
        node.style.animation = (node.style.animation || '')
            .split(', ')
            .filter(name
            ? anim => anim.indexOf(name) < 0 // remove specific animation
            : anim => anim.indexOf('__svelte') === -1 // remove all Svelte animations
        )
            .join(', ');
        if (name && !--active)
            clear_rules();
    }
    function clear_rules() {
        raf(() => {
            if (active)
                return;
            let i = stylesheet.cssRules.length;
            while (i--)
                stylesheet.deleteRule(i);
            current_rules = {};
        });
    }

    let current_component;
    function set_current_component(component) {
        current_component = component;
    }
    function get_current_component() {
        if (!current_component)
            throw new Error(`Function called outside component initialization`);
        return current_component;
    }
    function beforeUpdate(fn) {
        get_current_component().$$.before_update.push(fn);
    }
    function onMount(fn) {
        get_current_component().$$.on_mount.push(fn);
    }
    function onDestroy(fn) {
        get_current_component().$$.on_destroy.push(fn);
    }
    function createEventDispatcher() {
        const component = current_component;
        return (type, detail) => {
            const callbacks = component.$$.callbacks[type];
            if (callbacks) {
                // TODO are there situations where events could be dispatched
                // in a server (non-DOM) environment?
                const event = custom_event(type, detail);
                callbacks.slice().forEach(fn => {
                    fn.call(component, event);
                });
            }
        };
    }
    // TODO figure out if we still want to support
    // shorthand events, or if we want to implement
    // a real bubbling mechanism
    function bubble(component, event) {
        const callbacks = component.$$.callbacks[event.type];
        if (callbacks) {
            callbacks.slice().forEach(fn => fn(event));
        }
    }

    const dirty_components = [];
    const binding_callbacks = [];
    const render_callbacks = [];
    const flush_callbacks = [];
    const resolved_promise = Promise.resolve();
    let update_scheduled = false;
    function schedule_update() {
        if (!update_scheduled) {
            update_scheduled = true;
            resolved_promise.then(flush);
        }
    }
    function add_render_callback(fn) {
        render_callbacks.push(fn);
    }
    function flush() {
        const seen_callbacks = new Set();
        do {
            // first, call beforeUpdate functions
            // and update components
            while (dirty_components.length) {
                const component = dirty_components.shift();
                set_current_component(component);
                update(component.$$);
            }
            while (binding_callbacks.length)
                binding_callbacks.pop()();
            // then, once components are updated, call
            // afterUpdate functions. This may cause
            // subsequent updates...
            for (let i = 0; i < render_callbacks.length; i += 1) {
                const callback = render_callbacks[i];
                if (!seen_callbacks.has(callback)) {
                    callback();
                    // ...so guard against infinite loops
                    seen_callbacks.add(callback);
                }
            }
            render_callbacks.length = 0;
        } while (dirty_components.length);
        while (flush_callbacks.length) {
            flush_callbacks.pop()();
        }
        update_scheduled = false;
    }
    function update($$) {
        if ($$.fragment) {
            $$.update($$.dirty);
            run_all($$.before_update);
            $$.fragment.p($$.dirty, $$.ctx);
            $$.dirty = null;
            $$.after_update.forEach(add_render_callback);
        }
    }

    let promise;
    function wait() {
        if (!promise) {
            promise = Promise.resolve();
            promise.then(() => {
                promise = null;
            });
        }
        return promise;
    }
    function dispatch(node, direction, kind) {
        node.dispatchEvent(custom_event(`${direction ? 'intro' : 'outro'}${kind}`));
    }
    const outroing = new Set();
    let outros;
    function group_outros() {
        outros = {
            r: 0,
            c: [],
            p: outros // parent group
        };
    }
    function check_outros() {
        if (!outros.r) {
            run_all(outros.c);
        }
        outros = outros.p;
    }
    function transition_in(block, local) {
        if (block && block.i) {
            outroing.delete(block);
            block.i(local);
        }
    }
    function transition_out(block, local, detach, callback) {
        if (block && block.o) {
            if (outroing.has(block))
                return;
            outroing.add(block);
            outros.c.push(() => {
                outroing.delete(block);
                if (callback) {
                    if (detach)
                        block.d(1);
                    callback();
                }
            });
            block.o(local);
        }
    }
    const null_transition = { duration: 0 };
    function create_bidirectional_transition(node, fn, params, intro) {
        let config = fn(node, params);
        let t = intro ? 0 : 1;
        let running_program = null;
        let pending_program = null;
        let animation_name = null;
        function clear_animation() {
            if (animation_name)
                delete_rule(node, animation_name);
        }
        function init(program, duration) {
            const d = program.b - t;
            duration *= Math.abs(d);
            return {
                a: t,
                b: program.b,
                d,
                duration,
                start: program.start,
                end: program.start + duration,
                group: program.group
            };
        }
        function go(b) {
            const { delay = 0, duration = 300, easing = identity, tick = noop, css } = config || null_transition;
            const program = {
                start: now() + delay,
                b
            };
            if (!b) {
                // @ts-ignore todo: improve typings
                program.group = outros;
                outros.r += 1;
            }
            if (running_program) {
                pending_program = program;
            }
            else {
                // if this is an intro, and there's a delay, we need to do
                // an initial tick and/or apply CSS animation immediately
                if (css) {
                    clear_animation();
                    animation_name = create_rule(node, t, b, duration, delay, easing, css);
                }
                if (b)
                    tick(0, 1);
                running_program = init(program, duration);
                add_render_callback(() => dispatch(node, b, 'start'));
                loop(now => {
                    if (pending_program && now > pending_program.start) {
                        running_program = init(pending_program, duration);
                        pending_program = null;
                        dispatch(node, running_program.b, 'start');
                        if (css) {
                            clear_animation();
                            animation_name = create_rule(node, t, running_program.b, running_program.duration, 0, easing, config.css);
                        }
                    }
                    if (running_program) {
                        if (now >= running_program.end) {
                            tick(t = running_program.b, 1 - t);
                            dispatch(node, running_program.b, 'end');
                            if (!pending_program) {
                                // we're done
                                if (running_program.b) {
                                    // intro — we can tidy up immediately
                                    clear_animation();
                                }
                                else {
                                    // outro — needs to be coordinated
                                    if (!--running_program.group.r)
                                        run_all(running_program.group.c);
                                }
                            }
                            running_program = null;
                        }
                        else if (now >= running_program.start) {
                            const p = now - running_program.start;
                            t = running_program.a + running_program.d * easing(p / running_program.duration);
                            tick(t, 1 - t);
                        }
                    }
                    return !!(running_program || pending_program);
                });
            }
        }
        return {
            run(b) {
                if (is_function(config)) {
                    wait().then(() => {
                        // @ts-ignore
                        config = config();
                        go(b);
                    });
                }
                else {
                    go(b);
                }
            },
            end() {
                clear_animation();
                running_program = pending_program = null;
            }
        };
    }

    function handle_promise(promise, info) {
        const token = info.token = {};
        function update(type, index, key, value) {
            if (info.token !== token)
                return;
            info.resolved = key && { [key]: value };
            const child_ctx = assign(assign({}, info.ctx), info.resolved);
            const block = type && (info.current = type)(child_ctx);
            if (info.block) {
                if (info.blocks) {
                    info.blocks.forEach((block, i) => {
                        if (i !== index && block) {
                            group_outros();
                            transition_out(block, 1, 1, () => {
                                info.blocks[i] = null;
                            });
                            check_outros();
                        }
                    });
                }
                else {
                    info.block.d(1);
                }
                block.c();
                transition_in(block, 1);
                block.m(info.mount(), info.anchor);
                flush();
            }
            info.block = block;
            if (info.blocks)
                info.blocks[index] = block;
        }
        if (is_promise(promise)) {
            promise.then(value => {
                update(info.then, 1, info.value, value);
            }, error => {
                update(info.catch, 2, info.error, error);
            });
            // if we previously had a then/catch block, destroy it
            if (info.current !== info.pending) {
                update(info.pending, 0);
                return true;
            }
        }
        else {
            if (info.current !== info.then) {
                update(info.then, 1, info.value, promise);
                return true;
            }
            info.resolved = { [info.value]: promise };
        }
    }

    const globals = (typeof window !== 'undefined' ? window : global);

    function get_spread_update(levels, updates) {
        const update = {};
        const to_null_out = {};
        const accounted_for = { $$scope: 1 };
        let i = levels.length;
        while (i--) {
            const o = levels[i];
            const n = updates[i];
            if (n) {
                for (const key in o) {
                    if (!(key in n))
                        to_null_out[key] = 1;
                }
                for (const key in n) {
                    if (!accounted_for[key]) {
                        update[key] = n[key];
                        accounted_for[key] = 1;
                    }
                }
                levels[i] = n;
            }
            else {
                for (const key in o) {
                    accounted_for[key] = 1;
                }
            }
        }
        for (const key in to_null_out) {
            if (!(key in update))
                update[key] = undefined;
        }
        return update;
    }
    function mount_component(component, target, anchor) {
        const { fragment, on_mount, on_destroy, after_update } = component.$$;
        fragment.m(target, anchor);
        // onMount happens before the initial afterUpdate
        add_render_callback(() => {
            const new_on_destroy = on_mount.map(run).filter(is_function);
            if (on_destroy) {
                on_destroy.push(...new_on_destroy);
            }
            else {
                // Edge case - component was destroyed immediately,
                // most likely as a result of a binding initialising
                run_all(new_on_destroy);
            }
            component.$$.on_mount = [];
        });
        after_update.forEach(add_render_callback);
    }
    function destroy_component(component, detaching) {
        if (component.$$.fragment) {
            run_all(component.$$.on_destroy);
            component.$$.fragment.d(detaching);
            // TODO null out other refs, including component.$$ (but need to
            // preserve final state?)
            component.$$.on_destroy = component.$$.fragment = null;
            component.$$.ctx = {};
        }
    }
    function make_dirty(component, key) {
        if (!component.$$.dirty) {
            dirty_components.push(component);
            schedule_update();
            component.$$.dirty = blank_object();
        }
        component.$$.dirty[key] = true;
    }
    function init(component, options, instance, create_fragment, not_equal, prop_names) {
        const parent_component = current_component;
        set_current_component(component);
        const props = options.props || {};
        const $$ = component.$$ = {
            fragment: null,
            ctx: null,
            // state
            props: prop_names,
            update: noop,
            not_equal,
            bound: blank_object(),
            // lifecycle
            on_mount: [],
            on_destroy: [],
            before_update: [],
            after_update: [],
            context: new Map(parent_component ? parent_component.$$.context : []),
            // everything else
            callbacks: blank_object(),
            dirty: null
        };
        let ready = false;
        $$.ctx = instance
            ? instance(component, props, (key, value) => {
                if ($$.ctx && not_equal($$.ctx[key], $$.ctx[key] = value)) {
                    if ($$.bound[key])
                        $$.bound[key](value);
                    if (ready)
                        make_dirty(component, key);
                }
            })
            : props;
        $$.update();
        ready = true;
        run_all($$.before_update);
        $$.fragment = create_fragment($$.ctx);
        if (options.target) {
            if (options.hydrate) {
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment.l(children(options.target));
            }
            else {
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment.c();
            }
            if (options.intro)
                transition_in(component.$$.fragment);
            mount_component(component, options.target, options.anchor);
            flush();
        }
        set_current_component(parent_component);
    }
    class SvelteComponent {
        $destroy() {
            destroy_component(this, 1);
            this.$destroy = noop;
        }
        $on(type, callback) {
            const callbacks = (this.$$.callbacks[type] || (this.$$.callbacks[type] = []));
            callbacks.push(callback);
            return () => {
                const index = callbacks.indexOf(callback);
                if (index !== -1)
                    callbacks.splice(index, 1);
            };
        }
        $set() {
            // overridden by instance, if it has props
        }
    }
    class SvelteComponentDev extends SvelteComponent {
        constructor(options) {
            if (!options || (!options.target && !options.$$inline)) {
                throw new Error(`'target' is a required option`);
            }
            super();
        }
        $destroy() {
            super.$destroy();
            this.$destroy = () => {
                console.warn(`Component was already destroyed`); // eslint-disable-line no-console
            };
        }
    }

    function cubicOut(t) {
        const f = t - 1.0;
        return f * f * f + 1.0;
    }

    function fade(node, { delay = 0, duration = 400 }) {
        const o = +getComputedStyle(node).opacity;
        return {
            delay,
            duration,
            css: t => `opacity: ${t * o}`
        };
    }
    function fly(node, { delay = 0, duration = 400, easing = cubicOut, x = 0, y = 0, opacity = 0 }) {
        const style = getComputedStyle(node);
        const target_opacity = +style.opacity;
        const transform = style.transform === 'none' ? '' : style.transform;
        const od = target_opacity * (1 - opacity);
        return {
            delay,
            duration,
            easing,
            css: (t, u) => `
			transform: ${transform} translate(${(1 - t) * x}px, ${(1 - t) * y}px);
			opacity: ${target_opacity - (od * u)}`
        };
    }

    // Put "static" config data here - stuff that updates while
    // the app is running goes in store.js

    // TODO: get baseUrl from config json file for server-side rendering..
    const baseUrl = location.protocol + '//' + location.host;
    const apiUrl = baseUrl + '/api';

    const states = [
    	'',
    	'Ny',
    	'Kontaktet',
    	'Mangler info',
    	'Hentes',
    	'Hentet',
    	'Hentes ikke',
    ];

    /* client/src/components/RenderDays.svelte generated by Svelte v3.8.0 */

    const file = "client/src/components/RenderDays.svelte";

    function get_each_context(ctx, list, i) {
    	const child_ctx = Object.create(ctx);
    	child_ctx.day = list[i];
    	return child_ctx;
    }

    // (26:0) {#each Object.keys(state) as day}
    function create_each_block(ctx) {
    	var li, t_value = ctx.day + "", t;

    	return {
    		c: function create() {
    			li = element("li");
    			t = text(t_value);
    			attr(li, "class", "svelte-urasfe");
    			toggle_class(li, "active", ctx.state[ctx.day]);
    			add_location(li, file, 26, 1, 443);
    		},

    		m: function mount(target, anchor) {
    			insert(target, li, anchor);
    			append(li, t);
    		},

    		p: function update(changed, ctx) {
    			if ((changed.state) && t_value !== (t_value = ctx.day + "")) {
    				set_data(t, t_value);
    			}

    			if (changed.state) {
    				toggle_class(li, "active", ctx.state[ctx.day]);
    			}
    		},

    		d: function destroy(detaching) {
    			if (detaching) {
    				detach(li);
    			}
    		}
    	};
    }

    function create_fragment(ctx) {
    	var ol;

    	var each_value = Object.keys(ctx.state);

    	var each_blocks = [];

    	for (var i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block(get_each_context(ctx, each_value, i));
    	}

    	return {
    		c: function create() {
    			ol = element("ol");

    			for (var i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}
    			attr(ol, "class", "svelte-urasfe");
    			add_location(ol, file, 24, 0, 403);
    		},

    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},

    		m: function mount(target, anchor) {
    			insert(target, ol, anchor);

    			for (var i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(ol, null);
    			}
    		},

    		p: function update(changed, ctx) {
    			if (changed.state) {
    				each_value = Object.keys(ctx.state);

    				for (var i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(changed, child_ctx);
    					} else {
    						each_blocks[i] = create_each_block(child_ctx);
    						each_blocks[i].c();
    						each_blocks[i].m(ol, null);
    					}
    				}

    				for (; i < each_blocks.length; i += 1) {
    					each_blocks[i].d(1);
    				}
    				each_blocks.length = each_value.length;
    			}
    		},

    		i: noop,
    		o: noop,

    		d: function destroy(detaching) {
    			if (detaching) {
    				detach(ol);
    			}

    			destroy_each(each_blocks, detaching);
    		}
    	};
    }

    function instance($$self, $$props, $$invalidate) {
    	let { days } = $$props;
    	let state = {/*Ma: false,*/ Ti: false, On: false, To: false};
    	days.split(/, ?/g).forEach(day => {
    		state[day.substr(0,2)] = true; $$invalidate('state', state);
    	});

    	const writable_props = ['days'];
    	Object.keys($$props).forEach(key => {
    		if (!writable_props.includes(key) && !key.startsWith('$$')) console.warn(`<RenderDays> was created with unknown prop '${key}'`);
    	});

    	$$self.$set = $$props => {
    		if ('days' in $$props) $$invalidate('days', days = $$props.days);
    	};

    	return { days, state };
    }

    class RenderDays extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance, create_fragment, safe_not_equal, ["days"]);

    		const { ctx } = this.$$;
    		const props = options.props || {};
    		if (ctx.days === undefined && !('days' in props)) {
    			console.warn("<RenderDays> was created without expected prop 'days'");
    		}
    	}

    	get days() {
    		throw new Error("<RenderDays>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set days(value) {
    		throw new Error("<RenderDays>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* client/src/components/RenderTypes.svelte generated by Svelte v3.8.0 */

    const file$1 = "client/src/components/RenderTypes.svelte";

    function get_each_context$1(ctx, list, i) {
    	const child_ctx = Object.create(ctx);
    	child_ctx.typ = list[i];
    	return child_ctx;
    }

    // (27:18) 
    function create_if_block_1(ctx) {
    	var br, t_value = ctx.typ + "", t;

    	return {
    		c: function create() {
    			br = element("br");
    			t = text(t_value);
    			add_location(br, file$1, 27, 0, 703);
    		},

    		m: function mount(target, anchor) {
    			insert(target, br, anchor);
    			insert(target, t, anchor);
    		},

    		p: function update(changed, ctx) {
    			if ((changed.types) && t_value !== (t_value = ctx.typ + "")) {
    				set_data(t, t_value);
    			}
    		},

    		d: function destroy(detaching) {
    			if (detaching) {
    				detach(br);
    				detach(t);
    			}
    		}
    	};
    }

    // (25:0) {#if icons[typ]}
    function create_if_block(ctx) {
    	var img, img_src_value, img_alt_value, img_title_value;

    	return {
    		c: function create() {
    			img = element("img");
    			attr(img, "src", img_src_value = ctx.icons[ctx.typ]);
    			attr(img, "alt", img_alt_value = ctx.typ);
    			attr(img, "title", img_title_value = ctx.typ);
    			attr(img, "height", "24");
    			add_location(img, file$1, 25, 0, 625);
    		},

    		m: function mount(target, anchor) {
    			insert(target, img, anchor);
    		},

    		p: function update(changed, ctx) {
    			if ((changed.types) && img_src_value !== (img_src_value = ctx.icons[ctx.typ])) {
    				attr(img, "src", img_src_value);
    			}

    			if ((changed.types) && img_alt_value !== (img_alt_value = ctx.typ)) {
    				attr(img, "alt", img_alt_value);
    			}

    			if ((changed.types) && img_title_value !== (img_title_value = ctx.typ)) {
    				attr(img, "title", img_title_value);
    			}
    		},

    		d: function destroy(detaching) {
    			if (detaching) {
    				detach(img);
    			}
    		}
    	};
    }

    // (24:0) {#each types as typ}
    function create_each_block$1(ctx) {
    	var if_block_anchor;

    	function select_block_type(ctx) {
    		if (ctx.icons[ctx.typ]) return create_if_block;
    		if (ctx.showAll) return create_if_block_1;
    	}

    	var current_block_type = select_block_type(ctx);
    	var if_block = current_block_type && current_block_type(ctx);

    	return {
    		c: function create() {
    			if (if_block) if_block.c();
    			if_block_anchor = empty();
    		},

    		m: function mount(target, anchor) {
    			if (if_block) if_block.m(target, anchor);
    			insert(target, if_block_anchor, anchor);
    		},

    		p: function update(changed, ctx) {
    			if (current_block_type === (current_block_type = select_block_type(ctx)) && if_block) {
    				if_block.p(changed, ctx);
    			} else {
    				if (if_block) if_block.d(1);
    				if_block = current_block_type && current_block_type(ctx);
    				if (if_block) {
    					if_block.c();
    					if_block.m(if_block_anchor.parentNode, if_block_anchor);
    				}
    			}
    		},

    		d: function destroy(detaching) {
    			if (if_block) if_block.d(detaching);

    			if (detaching) {
    				detach(if_block_anchor);
    			}
    		}
    	};
    }

    function create_fragment$1(ctx) {
    	var each_1_anchor;

    	var each_value = ctx.types;

    	var each_blocks = [];

    	for (var i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block$1(get_each_context$1(ctx, each_value, i));
    	}

    	return {
    		c: function create() {
    			for (var i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			each_1_anchor = empty();
    		},

    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},

    		m: function mount(target, anchor) {
    			for (var i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(target, anchor);
    			}

    			insert(target, each_1_anchor, anchor);
    		},

    		p: function update(changed, ctx) {
    			if (changed.icons || changed.types || changed.showAll) {
    				each_value = ctx.types;

    				for (var i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context$1(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(changed, child_ctx);
    					} else {
    						each_blocks[i] = create_each_block$1(child_ctx);
    						each_blocks[i].c();
    						each_blocks[i].m(each_1_anchor.parentNode, each_1_anchor);
    					}
    				}

    				for (; i < each_blocks.length; i += 1) {
    					each_blocks[i].d(1);
    				}
    				each_blocks.length = each_value.length;
    			}
    		},

    		i: noop,
    		o: noop,

    		d: function destroy(detaching) {
    			destroy_each(each_blocks, detaching);

    			if (detaching) {
    				detach(each_1_anchor);
    			}
    		}
    	};
    }

    function instance$1($$self, $$props, $$invalidate) {
    	let { types = [], showAll = false } = $$props;
    let icons = {
    	'Møbler': '/images/mobler.png',
    	'Bøker': '/images/boker.png',
    	'Musikk': '/images/musikk.png',
    	'Klær': '/images/klaer.png',
    	'Film': '/images/film.png',
    	'Sykler': '/images/sykkel.png',
    	'Elektrisk': '/images/elektrisk.png',
    	'Sportsutstyr': '/images/sport.png',
    	'Kjøkkenutstyr': '/images/kjokken.png',
    	'Leker': '/images/leker.png'
    };
    beforeUpdate(() => {
    	if (typeof types === 'string') {
    		$$invalidate('types', types = types.split(/,\s+/g));
    	}
    });
    $$invalidate('types', types = types.split(/,\s+/g));

    	const writable_props = ['types', 'showAll'];
    	Object.keys($$props).forEach(key => {
    		if (!writable_props.includes(key) && !key.startsWith('$$')) console.warn(`<RenderTypes> was created with unknown prop '${key}'`);
    	});

    	$$self.$set = $$props => {
    		if ('types' in $$props) $$invalidate('types', types = $$props.types);
    		if ('showAll' in $$props) $$invalidate('showAll', showAll = $$props.showAll);
    	};

    	return { types, showAll, icons };
    }

    class RenderTypes extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$1, create_fragment$1, safe_not_equal, ["types", "showAll"]);
    	}

    	get types() {
    		throw new Error("<RenderTypes>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set types(value) {
    		throw new Error("<RenderTypes>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get showAll() {
    		throw new Error("<RenderTypes>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set showAll(value) {
    		throw new Error("<RenderTypes>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* client/src/components/Modal.svelte generated by Svelte v3.8.0 */

    const file$2 = "client/src/components/Modal.svelte";

    const get_header_slot_changes = () => ({});
    const get_header_slot_context = () => ({});

    function create_fragment$2(ctx) {
    	var div0, t0, div1, t1, hr0, t2, t3, hr1, current, dispose;

    	const header_slot_template = ctx.$$slots.header;
    	const header_slot = create_slot(header_slot_template, ctx, get_header_slot_context);

    	const default_slot_template = ctx.$$slots.default;
    	const default_slot = create_slot(default_slot_template, ctx, null);

    	return {
    		c: function create() {
    			div0 = element("div");
    			t0 = space();
    			div1 = element("div");

    			if (header_slot) header_slot.c();
    			t1 = space();
    			hr0 = element("hr");
    			t2 = space();

    			if (default_slot) default_slot.c();
    			t3 = space();
    			hr1 = element("hr");
    			attr(div0, "class", "modal-background svelte-rbafol");
    			add_location(div0, file$2, 54, 0, 1172);

    			add_location(hr0, file$2, 58, 1, 1318);

    			add_location(hr1, file$2, 60, 1, 1339);
    			attr(div1, "class", "modal svelte-rbafol");
    			add_location(div1, file$2, 56, 0, 1247);
    			dispose = listen(div0, "click", ctx.click_handler);
    		},

    		l: function claim(nodes) {
    			if (header_slot) header_slot.l(div1_nodes);

    			if (default_slot) default_slot.l(div1_nodes);
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},

    		m: function mount(target, anchor) {
    			insert(target, div0, anchor);
    			insert(target, t0, anchor);
    			insert(target, div1, anchor);

    			if (header_slot) {
    				header_slot.m(div1, null);
    			}

    			append(div1, t1);
    			append(div1, hr0);
    			append(div1, t2);

    			if (default_slot) {
    				default_slot.m(div1, null);
    			}

    			append(div1, t3);
    			append(div1, hr1);
    			ctx.div1_binding(div1);
    			current = true;
    		},

    		p: function update(changed, ctx) {
    			if (header_slot && header_slot.p && changed.$$scope) {
    				header_slot.p(
    					get_slot_changes(header_slot_template, ctx, changed, get_header_slot_changes),
    					get_slot_context(header_slot_template, ctx, get_header_slot_context)
    				);
    			}

    			if (default_slot && default_slot.p && changed.$$scope) {
    				default_slot.p(
    					get_slot_changes(default_slot_template, ctx, changed, null),
    					get_slot_context(default_slot_template, ctx, null)
    				);
    			}
    		},

    		i: function intro(local) {
    			if (current) return;
    			transition_in(header_slot, local);
    			transition_in(default_slot, local);
    			current = true;
    		},

    		o: function outro(local) {
    			transition_out(header_slot, local);
    			transition_out(default_slot, local);
    			current = false;
    		},

    		d: function destroy(detaching) {
    			if (detaching) {
    				detach(div0);
    				detach(t0);
    				detach(div1);
    			}

    			if (header_slot) header_slot.d(detaching);

    			if (default_slot) default_slot.d(detaching);
    			ctx.div1_binding(null);
    			dispose();
    		}
    	};
    }

    function instance$2($$self, $$props, $$invalidate) {
    	const dispatch = createEventDispatcher();
    	let modalElm;
    	let lastActiveElement;
    	onMount(() => {
    		if(modalElm && modalElm.scrollIntoView) {
    			modalElm.scrollIntoView();
    		}
    		if (modalElm && modalElm.querySelector) {
    			// accessibility: focus management
    			lastActiveElement = document.activeElement;
    			modalElm.querySelector('input, select, textarea, button').focus();
    		}
    	});
    	onDestroy(() => {
    		// TODO: this doesn't truly work as intended because focus will have gone to
    		// the right-clicked element or the menu element activated most of the time
    		if (lastActiveElement && lastActiveElement.focus) {
    			lastActiveElement.focus();
    		}
    	});

    	let { $$slots = {}, $$scope } = $$props;

    	function click_handler() {
    		return dispatch("close");
    	}

    	function div1_binding($$value) {
    		binding_callbacks[$$value ? 'unshift' : 'push'](() => {
    			$$invalidate('modalElm', modalElm = $$value);
    		});
    	}

    	$$self.$set = $$props => {
    		if ('$$scope' in $$props) $$invalidate('$$scope', $$scope = $$props.$$scope);
    	};

    	return {
    		dispatch,
    		modalElm,
    		click_handler,
    		div1_binding,
    		$$slots,
    		$$scope
    	};
    }

    class Modal extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$2, create_fragment$2, safe_not_equal, []);
    	}
    }

    /* client/src/components/DetailsEditor.svelte generated by Svelte v3.8.0 */

    const file$3 = "client/src/components/DetailsEditor.svelte";

    function create_fragment$3(ctx) {
    	var form, p0, span0, t0_value = ctx.descs.number + "", t0, t1, span1, input, t2, p1, span2, t3_value = ctx.descs.address + "", t3, t4, span3, textarea0, t5, p2, span4, t6_value = ctx.descs.info + "", t6, t7, span5, textarea1, t8, p3, span6, t9_value = ctx.descs.time + "", t9, span7, select, option0, option1, option2, t13, p4, span8, t14, span9, button0, t16, button1, dispose;

    	return {
    		c: function create() {
    			form = element("form");
    			p0 = element("p");
    			span0 = element("span");
    			t0 = text(t0_value);
    			t1 = text(":");
    			span1 = element("span");
    			input = element("input");
    			t2 = space();
    			p1 = element("p");
    			span2 = element("span");
    			t3 = text(t3_value);
    			t4 = text(":");
    			span3 = element("span");
    			textarea0 = element("textarea");
    			t5 = space();
    			p2 = element("p");
    			span4 = element("span");
    			t6 = text(t6_value);
    			t7 = text(":");
    			span5 = element("span");
    			textarea1 = element("textarea");
    			t8 = space();
    			p3 = element("p");
    			span6 = element("span");
    			t9 = text(t9_value);
    			span7 = element("span");
    			select = element("select");
    			option0 = element("option");
    			option0.textContent = "Tirsdag kveld";
    			option1 = element("option");
    			option1.textContent = "Onsdag kveld";
    			option2 = element("option");
    			option2.textContent = "Torsdag kveld";
    			t13 = space();
    			p4 = element("p");
    			span8 = element("span");
    			t14 = space();
    			span9 = element("span");
    			button0 = element("button");
    			button0.textContent = "Oppdater";
    			t16 = space();
    			button1 = element("button");
    			button1.textContent = "Avbryt";
    			attr(span0, "class", "svelte-184cksn");
    			add_location(span0, file$3, 61, 3, 1127);
    			attr(input, "inputmode", "tel");
    			attr(input, "class", "svelte-184cksn");
    			add_location(input, file$3, 61, 37, 1161);
    			attr(span1, "class", "svelte-184cksn");
    			add_location(span1, file$3, 61, 31, 1155);
    			attr(p0, "class", "svelte-184cksn");
    			add_location(p0, file$3, 60, 2, 1120);
    			attr(span2, "class", "svelte-184cksn");
    			add_location(span2, file$3, 64, 3, 1228);
    			attr(textarea0, "class", "svelte-184cksn");
    			add_location(textarea0, file$3, 64, 38, 1263);
    			attr(span3, "class", "svelte-184cksn");
    			add_location(span3, file$3, 64, 32, 1257);
    			attr(p1, "class", "svelte-184cksn");
    			add_location(p1, file$3, 63, 2, 1221);
    			attr(span4, "class", "svelte-184cksn");
    			add_location(span4, file$3, 67, 3, 1329);
    			attr(textarea1, "class", "svelte-184cksn");
    			add_location(textarea1, file$3, 67, 35, 1361);
    			attr(span5, "class", "svelte-184cksn");
    			add_location(span5, file$3, 67, 29, 1355);
    			attr(p2, "class", "svelte-184cksn");
    			add_location(p2, file$3, 66, 2, 1322);
    			attr(span6, "class", "svelte-184cksn");
    			add_location(span6, file$3, 70, 3, 1424);
    			option0.__value = "Tirsdag kveld";
    			option0.value = option0.__value;
    			attr(option0, "class", "svelte-184cksn");
    			add_location(option0, file$3, 73, 5, 1543);
    			option1.__value = "Onsdag kveld";
    			option1.value = option1.__value;
    			attr(option1, "class", "svelte-184cksn");
    			add_location(option1, file$3, 74, 5, 1579);
    			option2.__value = "Torsdag kveld";
    			option2.value = option2.__value;
    			attr(option2, "class", "svelte-184cksn");
    			add_location(option2, file$3, 75, 5, 1614);
    			if (ctx.time === void 0) add_render_callback(() => ctx.select_change_handler.call(select));
    			select.multiple = true;
    			attr(select, "class", "svelte-184cksn");
    			add_location(select, file$3, 71, 4, 1460);
    			attr(span7, "class", "svelte-184cksn");
    			add_location(span7, file$3, 70, 28, 1449);
    			attr(p3, "class", "svelte-184cksn");
    			add_location(p3, file$3, 69, 2, 1417);
    			attr(span8, "class", "svelte-184cksn");
    			add_location(span8, file$3, 79, 5, 1682);
    			attr(button0, "type", "submit");
    			attr(button0, "class", "p8 br2 svelte-184cksn");
    			add_location(button0, file$3, 81, 3, 1708);
    			attr(button1, "type", "button");
    			attr(button1, "class", "p8 br2 svelte-184cksn");
    			add_location(button1, file$3, 82, 3, 1767);
    			attr(span9, "class", "svelte-184cksn");
    			add_location(span9, file$3, 80, 2, 1698);
    			attr(p4, "class", "svelte-184cksn");
    			add_location(p4, file$3, 79, 2, 1679);
    			attr(form, "class", "svelte-184cksn");
    			add_location(form, file$3, 59, 0, 1069);

    			dispose = [
    				listen(input, "input", ctx.input_input_handler),
    				listen(textarea0, "input", ctx.textarea0_input_handler),
    				listen(textarea1, "input", ctx.textarea1_input_handler),
    				listen(select, "change", ctx.select_change_handler),
    				listen(button1, "click", ctx.click_handler),
    				listen(form, "submit", prevent_default(ctx.submit_handler))
    			];
    		},

    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},

    		m: function mount(target, anchor) {
    			insert(target, form, anchor);
    			append(form, p0);
    			append(p0, span0);
    			append(span0, t0);
    			append(span0, t1);
    			append(p0, span1);
    			append(span1, input);

    			input.value = ctx.number;

    			append(form, t2);
    			append(form, p1);
    			append(p1, span2);
    			append(span2, t3);
    			append(span2, t4);
    			append(p1, span3);
    			append(span3, textarea0);

    			textarea0.value = ctx.address;

    			append(form, t5);
    			append(form, p2);
    			append(p2, span4);
    			append(span4, t6);
    			append(span4, t7);
    			append(p2, span5);
    			append(span5, textarea1);

    			textarea1.value = ctx.info;

    			append(form, t8);
    			append(form, p3);
    			append(p3, span6);
    			append(span6, t9);
    			append(p3, span7);
    			append(span7, select);
    			append(select, option0);
    			append(select, option1);
    			append(select, option2);

    			select_options(select, ctx.time);

    			append(form, t13);
    			append(form, p4);
    			append(p4, span8);
    			append(p4, t14);
    			append(p4, span9);
    			append(span9, button0);
    			append(span9, t16);
    			append(span9, button1);
    		},

    		p: function update_1(changed, ctx) {
    			if (changed.number && (input.value !== ctx.number)) input.value = ctx.number;
    			if (changed.address) textarea0.value = ctx.address;
    			if (changed.info) textarea1.value = ctx.info;
    			if (changed.time) select_options(select, ctx.time);
    		},

    		i: noop,
    		o: noop,

    		d: function destroy(detaching) {
    			if (detaching) {
    				detach(form);
    			}

    			run_all(dispose);
    		}
    	};
    }

    function instance$3($$self, $$props, $$invalidate) {
    	let { job } = $$props;
    const dispatch = createEventDispatcher();


    let number = job.telefonnummer;
    let info = job.informasjonomloppene;
    let time = job.hentetidspunktkryssavsåmangedukan.split(/,\s*/g);
    let address = job.adresseforhenting;
    let descs = {
    	number: 'Mobilnummer',
    	time: 'Hentetidspunkt',
    	info: 'Om loppene', 
    	address: 'Adresse for henting'
    };

    function update() {
    	dispatch('update', {
    		telefonnummer: number,
    		adresseforhenting: address,
    		informasjonomloppene: info,
    		hentetidspunktkryssavsåmangedukan: time.join(', ')
    	});
    }

    	const writable_props = ['job'];
    	Object.keys($$props).forEach(key => {
    		if (!writable_props.includes(key) && !key.startsWith('$$')) console.warn(`<DetailsEditor> was created with unknown prop '${key}'`);
    	});

    	function input_input_handler() {
    		number = this.value;
    		$$invalidate('number', number);
    	}

    	function textarea0_input_handler() {
    		address = this.value;
    		$$invalidate('address', address);
    	}

    	function textarea1_input_handler() {
    		info = this.value;
    		$$invalidate('info', info);
    	}

    	function select_change_handler() {
    		time = select_multiple_value(this);
    		$$invalidate('time', time);
    	}

    	function click_handler(e) {
    		return dispatch('cancel');
    	}

    	function submit_handler(e) {
    		return update();
    	}

    	$$self.$set = $$props => {
    		if ('job' in $$props) $$invalidate('job', job = $$props.job);
    	};

    	return {
    		job,
    		dispatch,
    		number,
    		info,
    		time,
    		address,
    		descs,
    		update,
    		input_input_handler,
    		textarea0_input_handler,
    		textarea1_input_handler,
    		select_change_handler,
    		click_handler,
    		submit_handler
    	};
    }

    class DetailsEditor extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$3, create_fragment$3, safe_not_equal, ["job"]);

    		const { ctx } = this.$$;
    		const props = options.props || {};
    		if (ctx.job === undefined && !('job' in props)) {
    			console.warn("<DetailsEditor> was created without expected prop 'job'");
    		}
    	}

    	get job() {
    		throw new Error("<DetailsEditor>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set job(value) {
    		throw new Error("<DetailsEditor>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* client/src/components/RenderPerson.svelte generated by Svelte v3.8.0 */

    const file$4 = "client/src/components/RenderPerson.svelte";

    function create_fragment$4(ctx) {
    	var t0, t1, a0, t2, a0_href_value, t3, br, t4, t5, t6, a1, t7, a1_href_value, t8, a2, t9, a2_href_value, t10, a3, t11, a3_href_value;

    	return {
    		c: function create() {
    			t0 = text(ctx.name);
    			t1 = space();
    			a0 = element("a");
    			t2 = text("🔎");
    			t3 = space();
    			br = element("br");
    			t4 = space();
    			t5 = text(ctx.number);
    			t6 = space();
    			a1 = element("a");
    			t7 = text("☎");
    			t8 = space();
    			a2 = element("a");
    			t9 = text("✉");
    			t10 = space();
    			a3 = element("a");
    			t11 = text("🔎");
    			attr(a0, "href", a0_href_value = "https://www.gulesider.no/" + encodeURIComponent(ctx.name) + "/personer");
    			attr(a0, "target", "_blank");
    			attr(a0, "title", "Slå opp person på Gule sider");
    			attr(a0, "class", "svelte-11t3l74");
    			add_location(a0, file$4, 22, 0, 292);
    			add_location(br, file$4, 23, 0, 423);
    			attr(a1, "href", a1_href_value = "tel:" + ctx.number);
    			attr(a1, "title", "Ring nummer");
    			attr(a1, "class", "svelte-11t3l74");
    			add_location(a1, file$4, 24, 9, 437);
    			attr(a2, "href", a2_href_value = "sms:" + ctx.number);
    			attr(a2, "title", "Send SMS");
    			attr(a2, "class", "svelte-11t3l74");
    			add_location(a2, file$4, 25, 0, 488);
    			attr(a3, "href", a3_href_value = "https://www.gulesider.no/" + ctx.number + "/personer");
    			attr(a3, "target", "_blank");
    			attr(a3, "title", "slå opp nummer på Gule sider");
    			attr(a3, "class", "svelte-11t3l74");
    			add_location(a3, file$4, 26, 0, 535);
    		},

    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},

    		m: function mount(target, anchor) {
    			insert(target, t0, anchor);
    			insert(target, t1, anchor);
    			insert(target, a0, anchor);
    			append(a0, t2);
    			insert(target, t3, anchor);
    			insert(target, br, anchor);
    			insert(target, t4, anchor);
    			insert(target, t5, anchor);
    			insert(target, t6, anchor);
    			insert(target, a1, anchor);
    			append(a1, t7);
    			insert(target, t8, anchor);
    			insert(target, a2, anchor);
    			append(a2, t9);
    			insert(target, t10, anchor);
    			insert(target, a3, anchor);
    			append(a3, t11);
    		},

    		p: function update(changed, ctx) {
    			if (changed.name) {
    				set_data(t0, ctx.name);
    			}

    			if ((changed.name) && a0_href_value !== (a0_href_value = "https://www.gulesider.no/" + encodeURIComponent(ctx.name) + "/personer")) {
    				attr(a0, "href", a0_href_value);
    			}

    			if (changed.number) {
    				set_data(t5, ctx.number);
    			}

    			if ((changed.number) && a1_href_value !== (a1_href_value = "tel:" + ctx.number)) {
    				attr(a1, "href", a1_href_value);
    			}

    			if ((changed.number) && a2_href_value !== (a2_href_value = "sms:" + ctx.number)) {
    				attr(a2, "href", a2_href_value);
    			}

    			if ((changed.number) && a3_href_value !== (a3_href_value = "https://www.gulesider.no/" + ctx.number + "/personer")) {
    				attr(a3, "href", a3_href_value);
    			}
    		},

    		i: noop,
    		o: noop,

    		d: function destroy(detaching) {
    			if (detaching) {
    				detach(t0);
    				detach(t1);
    				detach(a0);
    				detach(t3);
    				detach(br);
    				detach(t4);
    				detach(t5);
    				detach(t6);
    				detach(a1);
    				detach(t8);
    				detach(a2);
    				detach(t10);
    				detach(a3);
    			}
    		}
    	};
    }

    function instance$4($$self, $$props, $$invalidate) {
    	let { name, number } = $$props;

    	const writable_props = ['name', 'number'];
    	Object.keys($$props).forEach(key => {
    		if (!writable_props.includes(key) && !key.startsWith('$$')) console.warn(`<RenderPerson> was created with unknown prop '${key}'`);
    	});

    	$$self.$set = $$props => {
    		if ('name' in $$props) $$invalidate('name', name = $$props.name);
    		if ('number' in $$props) $$invalidate('number', number = $$props.number);
    	};

    	return { name, number };
    }

    class RenderPerson extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$4, create_fragment$4, safe_not_equal, ["name", "number"]);

    		const { ctx } = this.$$;
    		const props = options.props || {};
    		if (ctx.name === undefined && !('name' in props)) {
    			console.warn("<RenderPerson> was created without expected prop 'name'");
    		}
    		if (ctx.number === undefined && !('number' in props)) {
    			console.warn("<RenderPerson> was created without expected prop 'number'");
    		}
    	}

    	get name() {
    		throw new Error("<RenderPerson>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set name(value) {
    		throw new Error("<RenderPerson>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get number() {
    		throw new Error("<RenderPerson>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set number(value) {
    		throw new Error("<RenderPerson>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* client/src/components/RenderStars.svelte generated by Svelte v3.8.0 */

    const file$5 = "client/src/components/RenderStars.svelte";

    function get_each_context$2(ctx, list, i) {
    	const child_ctx = Object.create(ctx);
    	child_ctx.star = list[i];
    	child_ctx.index = i;
    	return child_ctx;
    }

    // (37:0) {#each stars as star, index}
    function create_each_block$2(ctx) {
    	var img, img_src_value, img_alt_value, dispose;

    	return {
    		c: function create() {
    			img = element("img");
    			attr(img, "src", img_src_value = ctx.star);
    			attr(img, "alt", img_alt_value = "poeng: " + ctx.qualityRanking);
    			attr(img, "data-index", ctx.index);
    			attr(img, "class", "svelte-ssp047");
    			add_location(img, file$5, 37, 1, 831);
    			dispose = listen(img, "click", ctx.handleClick);
    		},

    		m: function mount(target, anchor) {
    			insert(target, img, anchor);
    		},

    		p: function update(changed, ctx) {
    			if ((changed.stars) && img_src_value !== (img_src_value = ctx.star)) {
    				attr(img, "src", img_src_value);
    			}

    			if ((changed.qualityRanking) && img_alt_value !== (img_alt_value = "poeng: " + ctx.qualityRanking)) {
    				attr(img, "alt", img_alt_value);
    			}
    		},

    		d: function destroy(detaching) {
    			if (detaching) {
    				detach(img);
    			}

    			dispose();
    		}
    	};
    }

    function create_fragment$5(ctx) {
    	var div;

    	var each_value = ctx.stars;

    	var each_blocks = [];

    	for (var i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block$2(get_each_context$2(ctx, each_value, i));
    	}

    	return {
    		c: function create() {
    			div = element("div");

    			for (var i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}
    			add_location(div, file$5, 35, 0, 795);
    		},

    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},

    		m: function mount(target, anchor) {
    			insert(target, div, anchor);

    			for (var i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(div, null);
    			}
    		},

    		p: function update(changed, ctx) {
    			if (changed.stars || changed.qualityRanking) {
    				each_value = ctx.stars;

    				for (var i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context$2(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(changed, child_ctx);
    					} else {
    						each_blocks[i] = create_each_block$2(child_ctx);
    						each_blocks[i].c();
    						each_blocks[i].m(div, null);
    					}
    				}

    				for (; i < each_blocks.length; i += 1) {
    					each_blocks[i].d(1);
    				}
    				each_blocks.length = each_value.length;
    			}
    		},

    		i: noop,
    		o: noop,

    		d: function destroy(detaching) {
    			if (detaching) {
    				detach(div);
    			}

    			destroy_each(each_blocks, detaching);
    		}
    	};
    }

    let img1 = '/images/star-empty.png';

    let img2 = '/images/star-full.png';

    function instance$5($$self, $$props, $$invalidate) {
    	const dispatch = createEventDispatcher();
    	let { qualityRanking = 0 } = $$props;
    	let stars = [];
    	for(let i=0; i < qualityRanking; i++) {
    		stars.push(img2);
    	}
    	for(let i = qualityRanking; i < 3; i++) {
    		stars.push(img1);
    	}
    	function handleClick(evt) {
    		let idx = parseInt(evt.target.getAttribute('data-index'));
    		$$invalidate('qualityRanking', qualityRanking = idx + 1);
    		dispatch('qualityupdate', {kvalitet: idx});
    		for (let i = 0; i <= idx; i++) {
    			stars[i] = img2; $$invalidate('stars', stars);
    		}
    		for(let i=idx + 1; i < stars.length; i++) {
    			stars[i] = img1; $$invalidate('stars', stars);
    		}
    	}

    	const writable_props = ['qualityRanking'];
    	Object.keys($$props).forEach(key => {
    		if (!writable_props.includes(key) && !key.startsWith('$$')) console.warn(`<RenderStars> was created with unknown prop '${key}'`);
    	});

    	$$self.$set = $$props => {
    		if ('qualityRanking' in $$props) $$invalidate('qualityRanking', qualityRanking = $$props.qualityRanking);
    	};

    	return { qualityRanking, stars, handleClick };
    }

    class RenderStars extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$5, create_fragment$5, safe_not_equal, ["qualityRanking"]);
    	}

    	get qualityRanking() {
    		throw new Error("<RenderStars>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set qualityRanking(value) {
    		throw new Error("<RenderStars>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* client/src/components/LoadingIcon.svelte generated by Svelte v3.8.0 */

    const file$6 = "client/src/components/LoadingIcon.svelte";

    function create_fragment$6(ctx) {
    	var div;

    	return {
    		c: function create() {
    			div = element("div");
    			attr(div, "class", "lds-dual-ring svelte-1sriuqy");
    			set_style(div, "width", "" + ctx.w + "px");
    			set_style(div, "height", "" + ctx.h + "px");
    			add_location(div, file$6, 29, 0, 487);
    		},

    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},

    		m: function mount(target, anchor) {
    			insert(target, div, anchor);
    		},

    		p: function update(changed, ctx) {
    			if (changed.w) {
    				set_style(div, "width", "" + ctx.w + "px");
    			}

    			if (changed.h) {
    				set_style(div, "height", "" + ctx.h + "px");
    			}
    		},

    		i: noop,
    		o: noop,

    		d: function destroy(detaching) {
    			if (detaching) {
    				detach(div);
    			}
    		}
    	};
    }

    function instance$6($$self, $$props, $$invalidate) {
    	let { w = 32, h = 32 } = $$props;

    	const writable_props = ['w', 'h'];
    	Object.keys($$props).forEach(key => {
    		if (!writable_props.includes(key) && !key.startsWith('$$')) console.warn(`<LoadingIcon> was created with unknown prop '${key}'`);
    	});

    	$$self.$set = $$props => {
    		if ('w' in $$props) $$invalidate('w', w = $$props.w);
    		if ('h' in $$props) $$invalidate('h', h = $$props.h);
    	};

    	return { w, h };
    }

    class LoadingIcon extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$6, create_fragment$6, safe_not_equal, ["w", "h"]);
    	}

    	get w() {
    		throw new Error("<LoadingIcon>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set w(value) {
    		throw new Error("<LoadingIcon>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get h() {
    		throw new Error("<LoadingIcon>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set h(value) {
    		throw new Error("<LoadingIcon>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    const subscriber_queue = [];
    /**
     * Create a `Writable` store that allows both updating and reading by subscription.
     * @param {*=}value initial value
     * @param {StartStopNotifier=}start start and stop notifications for subscriptions
     */
    function writable(value, start = noop) {
        let stop;
        const subscribers = [];
        function set(new_value) {
            if (safe_not_equal(value, new_value)) {
                value = new_value;
                if (stop) { // store is ready
                    const run_queue = !subscriber_queue.length;
                    for (let i = 0; i < subscribers.length; i += 1) {
                        const s = subscribers[i];
                        s[1]();
                        subscriber_queue.push(s, value);
                    }
                    if (run_queue) {
                        for (let i = 0; i < subscriber_queue.length; i += 2) {
                            subscriber_queue[i][0](subscriber_queue[i + 1]);
                        }
                        subscriber_queue.length = 0;
                    }
                }
            }
        }
        function update(fn) {
            set(fn(value));
        }
        function subscribe(run, invalidate = noop) {
            const subscriber = [run, invalidate];
            subscribers.push(subscriber);
            if (subscribers.length === 1) {
                stop = start(set) || noop;
            }
            run(value);
            return () => {
                const index = subscribers.indexOf(subscriber);
                if (index !== -1) {
                    subscribers.splice(index, 1);
                }
                if (subscribers.length === 0) {
                    stop();
                    stop = null;
                }
            };
        }
        return { set, update, subscribe };
    }

    const drivers = writable([]);
    const jobs = writable([]);

    // contents of drivers are synced to localStorage
    if (typeof localStorage !== 'undefined') {
    	let existingData = localStorage.getItem('drivers');
    	if (existingData) {
    		drivers.set(JSON.parse(existingData));
    	}
    	let unsub = drivers.subscribe(data => {
    		localStorage.setItem('drivers', JSON.stringify(data));
    	});
    }

    const FROM = '4741238002';

    function changeJobDetails(id, newState, token) {
    	jobs.update(jobs => {
    		jobs.find(job => job.id === id).loading = true;
    		return jobs;
    	});
    	let url = apiUrl + '/update';
    	if (token) {
    		url += '?token=' + token;
    	}
    	return fetch(url , {
    		method: 'post',
    		headers: {'Content-type': 'application/json'},
    		body: JSON.stringify({id, details:  newState}),
    	})
    	.then(response => response.json())
    	.then(data => {
    		console.log(data);
    		jobs.update(jobs => {
    			let theJob = jobs.find(job => job.id === data.id);
    			Object.assign(theJob, data.saved, {loading: false});
    			return jobs;
    		});
    		return data;
    	});
    }

    function sendSms(recipients, message) {
    	recipients = recipients.map(number => {
    			number = number.replace(/\s/g, ''); // no spaces
    			return '47' + number; // Norway prefix
    		})
    		.join(',');
    	// support {number} substitution tag
    	let param1;
    	if (message.indexOf('{number}')) {
    		message = message.replace(/\{number\}/g, '[%1%]');
    		param1 = recipients.split(/,/g).join('|');
    	}
    	return fetch(apiUrl + '/sendsms', {
    		method: 'post',
    		headers: {'Content-type': 'application/json'},
    		body: JSON.stringify({
    			to: recipients,
    			from: FROM,
    			message,
    			param1
    		}),
    	})
    	.then(response => response.json())
    	.then(data => {
    		console.log(data);
    		if (data.error) {
    			throw new Error(data.message);
    		}
    		return data;
    	})
    }

    function getIdFromUrl(url) {
    	return url.split(/\//g)
    		.splice(-2)
    		.join('/');
    }

    // SMSapi uses the national 47 prefix but w/o +, we typically want to
    // strip that out. I remove whitespace just in case we use this method
    // on input form non-SMSapi sources..
    function normalizeNumber(str) {
    	return str.replace(/\s*/g, '').substr(-8);
    }

    function filter(string, sizePref, dayPref, typeFilter, hideDoneJobs, job) {
    	if (hideDoneJobs && ['Hentet', 'Hentes ikke'].indexOf(job.status) > -1) {
    		return false;
    	}
    	// all the "defaults" set - noop
    	if (sizePref.smallActive && sizePref.bigActive &&
    		dayPref.monActive && dayPref.tueActive && dayPref.wedActive &&
    		dayPref.thuActive && !dayPref.dayFilterExclusive && !string &&
    		!typeFilter)
    	{
    		return true;
    	}

    	if (!sizePref.bigActive && job['størrelse']) {
    		return false;
    	}
    	if (!sizePref.smallActive && !job['størrelse']) {
    		return false;
    	}

    	if (typeFilter && job['typerlopper'].indexOf(typeFilter) === -1) {
    		return false;
    	}

    	let showDay = [
    		//{prop: dayPref.monActive, str: 'Mandag'},
    		{prop: dayPref.tueActive, str: 'Tirsdag'},
    		{prop: dayPref.wedActive, str: 'Onsdag'},
    		{prop: dayPref.thuActive, str: 'Torsdag'}
    	]
    	.map(item => {
    		if (dayPref.dayFilterExclusive) {
    			return job['hentetidspunktkryssavsåmangedukan'].indexOf(item.str) > -1 === item.prop;
    		}
    		return item.prop && job['hentetidspunktkryssavsåmangedukan'].indexOf(item.str) > -1
    	});
    	if (dayPref.dayFilterExclusive) {
    		// all must be true
    		showDay = showDay.reduce((tot, now) => tot && now, true);
    	} else {
    		showDay = showDay.indexOf(true) > -1;
    	}
    	if (!showDay) {
    		return false;
    	}

    	return [
    		'adresseforhenting',
    		'typerlopper',
    		'navnpåkontaktperson',
    		'telefonnummer',
    		'informasjonomloppene',
    		'status',
    	].map(key => job[key].indexOf(string) > -1)
    	.indexOf(true) > -1;
    }

    /* client/src/components/RenderJob.svelte generated by Svelte v3.8.0 */

    const file$7 = "client/src/components/RenderJob.svelte";

    function get_each_context$3(ctx, list, i) {
    	const child_ctx = Object.create(ctx);
    	child_ctx.theState = list[i];
    	return child_ctx;
    }

    // (130:0) {#if itemData.loading}
    function create_if_block_4(ctx) {
    	var div, current;

    	var loadingicon = new LoadingIcon({
    		props: { w: "24", h: "24" },
    		$$inline: true
    	});

    	return {
    		c: function create() {
    			div = element("div");
    			loadingicon.$$.fragment.c();
    			attr(div, "class", "svelte-1cd40x6");
    			add_location(div, file$7, 129, 22, 2806);
    		},

    		m: function mount(target, anchor) {
    			insert(target, div, anchor);
    			mount_component(loadingicon, div, null);
    			current = true;
    		},

    		i: function intro(local) {
    			if (current) return;
    			transition_in(loadingicon.$$.fragment, local);

    			current = true;
    		},

    		o: function outro(local) {
    			transition_out(loadingicon.$$.fragment, local);
    			current = false;
    		},

    		d: function destroy(detaching) {
    			if (detaching) {
    				detach(div);
    			}

    			destroy_component(loadingicon);
    		}
    	};
    }

    // (143:0) {:else}
    function create_else_block(ctx) {
    	var img;

    	return {
    		c: function create() {
    			img = element("img");
    			attr(img, "src", "/images/smallcar.png");
    			attr(img, "alt", "liten bil");
    			attr(img, "height", "22");
    			add_location(img, file$7, 143, 0, 3221);
    		},

    		m: function mount(target, anchor) {
    			insert(target, img, anchor);
    		},

    		d: function destroy(detaching) {
    			if (detaching) {
    				detach(img);
    			}
    		}
    	};
    }

    // (141:0) {#if itemData.størrelse}
    function create_if_block_3(ctx) {
    	var img;

    	return {
    		c: function create() {
    			img = element("img");
    			attr(img, "src", "/images/bigcar.png");
    			attr(img, "alt", "stor bil");
    			attr(img, "height", "22");
    			add_location(img, file$7, 141, 0, 3155);
    		},

    		m: function mount(target, anchor) {
    			insert(target, img, anchor);
    		},

    		d: function destroy(detaching) {
    			if (detaching) {
    				detach(img);
    			}
    		}
    	};
    }

    // (160:1) {#each states as theState}
    function create_each_block$3(ctx) {
    	var option, t_value = ctx.theState + "", t, option_value_value;

    	return {
    		c: function create() {
    			option = element("option");
    			t = text(t_value);
    			option.__value = option_value_value = ctx.theState;
    			option.value = option.__value;
    			add_location(option, file$7, 160, 2, 4090);
    		},

    		m: function mount(target, anchor) {
    			insert(target, option, anchor);
    			append(option, t);
    		},

    		p: function update_1(changed, ctx) {
    			option.value = option.__value;
    		},

    		d: function destroy(detaching) {
    			if (detaching) {
    				detach(option);
    			}
    		}
    	};
    }

    // (164:0) {#if itemData.hentesav}
    function create_if_block_2(ctx) {
    	var div, a, t0_value = ctx.getDriverName(ctx.itemData.hentesav) + "", t0, a_href_value, t1, t2_value = statusVerbString(ctx.itemData.status) + "", t2;

    	return {
    		c: function create() {
    			div = element("div");
    			a = element("a");
    			t0 = text(t0_value);
    			t1 = space();
    			t2 = text(t2_value);
    			attr(a, "href", a_href_value = "tel:" + normalizeNumber(ctx.itemData.hentesav));
    			add_location(a, file$7, 164, 23, 4184);
    			attr(div, "class", "hentesav svelte-1cd40x6");
    			add_location(div, file$7, 164, 1, 4162);
    		},

    		m: function mount(target, anchor) {
    			insert(target, div, anchor);
    			append(div, a);
    			append(a, t0);
    			append(div, t1);
    			append(div, t2);
    		},

    		p: function update_1(changed, ctx) {
    			if ((changed.itemData) && t0_value !== (t0_value = ctx.getDriverName(ctx.itemData.hentesav) + "")) {
    				set_data(t0, t0_value);
    			}

    			if ((changed.itemData) && a_href_value !== (a_href_value = "tel:" + normalizeNumber(ctx.itemData.hentesav))) {
    				attr(a, "href", a_href_value);
    			}

    			if ((changed.itemData) && t2_value !== (t2_value = statusVerbString(ctx.itemData.status) + "")) {
    				set_data(t2, t2_value);
    			}
    		},

    		d: function destroy(detaching) {
    			if (detaching) {
    				detach(div);
    			}
    		}
    	};
    }

    // (171:0) {#if expanded}
    function create_if_block$1(ctx) {
    	var tr, td0, td1, p0, t0, p1, t1_value = ctx.itemData.typerlopper + "", t1, t2, p2, i, t3_value = ctx.itemData.informasjonomloppene + "", t3, t4, td2, button, img, t5, tr_data_id_value, current, dispose;

    	var renderperson = new RenderPerson({
    		props: {
    		name: ctx.itemData.navnpåkontaktperson,
    		number: ctx.itemData.telefonnummer
    	},
    		$$inline: true
    	});

    	var if_block = (ctx.showEditor) && create_if_block_1$1(ctx);

    	return {
    		c: function create() {
    			tr = element("tr");
    			td0 = element("td");
    			td1 = element("td");
    			p0 = element("p");
    			renderperson.$$.fragment.c();
    			t0 = space();
    			p1 = element("p");
    			t1 = text(t1_value);
    			t2 = space();
    			p2 = element("p");
    			i = element("i");
    			t3 = text(t3_value);
    			t4 = space();
    			td2 = element("td");
    			button = element("button");
    			img = element("img");
    			t5 = space();
    			if (if_block) if_block.c();
    			attr(td0, "class", "svelte-1cd40x6");
    			add_location(td0, file$7, 170, 40, 4379);
    			add_location(p0, file$7, 171, 1, 4424);
    			add_location(p1, file$7, 174, 1, 4522);
    			add_location(i, file$7, 175, 4, 4556);
    			add_location(p2, file$7, 175, 1, 4553);
    			attr(td1, "colspan", "3");
    			attr(td1, "class", "extrainfo svelte-1cd40x6");
    			add_location(td1, file$7, 170, 49, 4388);
    			attr(img, "src", "/images/edit.png");
    			attr(img, "alt", "endre detaljer");
    			attr(img, "width", "36");
    			attr(img, "class", "svelte-1cd40x6");
    			add_location(img, file$7, 178, 43, 4653);
    			attr(button, "class", "svelte-1cd40x6");
    			add_location(button, file$7, 178, 1, 4611);
    			attr(td2, "class", "svelte-1cd40x6");
    			add_location(td2, file$7, 177, 0, 4605);
    			attr(tr, "data-id", tr_data_id_value = ctx.itemData.id);
    			add_location(tr, file$7, 170, 14, 4353);
    			dispose = listen(button, "click", ctx.click_handler_3);
    		},

    		m: function mount(target, anchor) {
    			insert(target, tr, anchor);
    			append(tr, td0);
    			append(tr, td1);
    			append(td1, p0);
    			mount_component(renderperson, p0, null);
    			append(td1, t0);
    			append(td1, p1);
    			append(p1, t1);
    			append(td1, t2);
    			append(td1, p2);
    			append(p2, i);
    			append(i, t3);
    			append(tr, t4);
    			append(tr, td2);
    			append(td2, button);
    			append(button, img);
    			append(td2, t5);
    			if (if_block) if_block.m(td2, null);
    			current = true;
    		},

    		p: function update_1(changed, ctx) {
    			var renderperson_changes = {};
    			if (changed.itemData) renderperson_changes.name = ctx.itemData.navnpåkontaktperson;
    			if (changed.itemData) renderperson_changes.number = ctx.itemData.telefonnummer;
    			renderperson.$set(renderperson_changes);

    			if ((!current || changed.itemData) && t1_value !== (t1_value = ctx.itemData.typerlopper + "")) {
    				set_data(t1, t1_value);
    			}

    			if ((!current || changed.itemData) && t3_value !== (t3_value = ctx.itemData.informasjonomloppene + "")) {
    				set_data(t3, t3_value);
    			}

    			if (ctx.showEditor) {
    				if (if_block) {
    					if_block.p(changed, ctx);
    					transition_in(if_block, 1);
    				} else {
    					if_block = create_if_block_1$1(ctx);
    					if_block.c();
    					transition_in(if_block, 1);
    					if_block.m(td2, null);
    				}
    			} else if (if_block) {
    				group_outros();
    				transition_out(if_block, 1, 1, () => {
    					if_block = null;
    				});
    				check_outros();
    			}

    			if ((!current || changed.itemData) && tr_data_id_value !== (tr_data_id_value = ctx.itemData.id)) {
    				attr(tr, "data-id", tr_data_id_value);
    			}
    		},

    		i: function intro(local) {
    			if (current) return;
    			transition_in(renderperson.$$.fragment, local);

    			transition_in(if_block);
    			current = true;
    		},

    		o: function outro(local) {
    			transition_out(renderperson.$$.fragment, local);
    			transition_out(if_block);
    			current = false;
    		},

    		d: function destroy(detaching) {
    			if (detaching) {
    				detach(tr);
    			}

    			destroy_component(renderperson);

    			if (if_block) if_block.d();
    			dispose();
    		}
    	};
    }

    // (180:1) {#if showEditor}
    function create_if_block_1$1(ctx) {
    	var current;

    	var modal = new Modal({
    		props: {
    		$$slots: {
    		default: [create_default_slot],
    		header: [create_header_slot]
    	},
    		$$scope: { ctx }
    	},
    		$$inline: true
    	});
    	modal.$on("close", ctx.close_handler);

    	return {
    		c: function create() {
    			modal.$$.fragment.c();
    		},

    		m: function mount(target, anchor) {
    			mount_component(modal, target, anchor);
    			current = true;
    		},

    		p: function update_1(changed, ctx) {
    			var modal_changes = {};
    			if (changed.$$scope || changed.itemData) modal_changes.$$scope = { changed, ctx };
    			modal.$set(modal_changes);
    		},

    		i: function intro(local) {
    			if (current) return;
    			transition_in(modal.$$.fragment, local);

    			current = true;
    		},

    		o: function outro(local) {
    			transition_out(modal.$$.fragment, local);
    			current = false;
    		},

    		d: function destroy(detaching) {
    			destroy_component(modal, detaching);
    		}
    	};
    }

    // (182:3) <h2 slot="header">
    function create_header_slot(ctx) {
    	var h2;

    	return {
    		c: function create() {
    			h2 = element("h2");
    			h2.textContent = "Endre detaljer";
    			attr(h2, "slot", "header");
    			add_location(h2, file$7, 181, 3, 4793);
    		},

    		m: function mount(target, anchor) {
    			insert(target, h2, anchor);
    		},

    		d: function destroy(detaching) {
    			if (detaching) {
    				detach(h2);
    			}
    		}
    	};
    }

    // (181:2) <Modal on:close="{() => showEditor = false}" >
    function create_default_slot(ctx) {
    	var t, current;

    	var detailseditor = new DetailsEditor({
    		props: { job: ctx.itemData },
    		$$inline: true
    	});
    	detailseditor.$on("update", ctx.update);
    	detailseditor.$on("cancel", ctx.cancel_handler);

    	return {
    		c: function create() {
    			t = space();
    			detailseditor.$$.fragment.c();
    		},

    		m: function mount(target, anchor) {
    			insert(target, t, anchor);
    			mount_component(detailseditor, target, anchor);
    			current = true;
    		},

    		p: function update_1(changed, ctx) {
    			var detailseditor_changes = {};
    			if (changed.itemData) detailseditor_changes.job = ctx.itemData;
    			detailseditor.$set(detailseditor_changes);
    		},

    		i: function intro(local) {
    			if (current) return;
    			transition_in(detailseditor.$$.fragment, local);

    			current = true;
    		},

    		o: function outro(local) {
    			transition_out(detailseditor.$$.fragment, local);
    			current = false;
    		},

    		d: function destroy(detaching) {
    			if (detaching) {
    				detach(t);
    			}

    			destroy_component(detailseditor, detaching);
    		}
    	};
    }

    function create_fragment$7(ctx) {
    	var tr, td0, t0, t1_value = ctx.itemData.adresseforhenting + "", t1, t2, a, t3, a_href_value, t4, br, t5, div, i, t6_value = ctx.itemData.hentetidspunktkryssavsåmangedukan + "", t6, t7, td1, t8, td2, t9, td3, t10, td4, t11, td5, input, input_id_value, t12, label, t13, label_for_value, t14, select, t15, tr_data_id_value, t16, if_block3_anchor, current, dispose;

    	var if_block0 = (ctx.itemData.loading) && create_if_block_4();

    	function select_block_type(ctx) {
    		if (ctx.itemData.størrelse) return create_if_block_3;
    		return create_else_block;
    	}

    	var current_block_type = select_block_type(ctx);
    	var if_block1 = current_block_type(ctx);

    	var rendertypes = new RenderTypes({
    		props: { types: ctx.itemData.typerlopper },
    		$$inline: true
    	});

    	var renderstars = new RenderStars({
    		props: { qualityRanking: ctx.itemData.kvalitet },
    		$$inline: true
    	});
    	renderstars.$on("qualityupdate", ctx.update);

    	var renderdays = new RenderDays({
    		props: { days: ctx.itemData.hentetidspunktkryssavsåmangedukan },
    		$$inline: true
    	});

    	var each_value = states;

    	var each_blocks = [];

    	for (var i_1 = 0; i_1 < each_value.length; i_1 += 1) {
    		each_blocks[i_1] = create_each_block$3(get_each_context$3(ctx, each_value, i_1));
    	}

    	var if_block2 = (ctx.itemData.hentesav) && create_if_block_2(ctx);

    	var if_block3 = (ctx.expanded) && create_if_block$1(ctx);

    	return {
    		c: function create() {
    			tr = element("tr");
    			td0 = element("td");
    			if (if_block0) if_block0.c();
    			t0 = space();
    			t1 = text(t1_value);
    			t2 = space();
    			a = element("a");
    			t3 = text("🔎");
    			t4 = space();
    			br = element("br");
    			t5 = space();
    			div = element("div");
    			i = element("i");
    			t6 = text(t6_value);
    			t7 = space();
    			td1 = element("td");
    			if_block1.c();
    			t8 = space();
    			td2 = element("td");
    			rendertypes.$$.fragment.c();
    			t9 = space();
    			td3 = element("td");
    			renderstars.$$.fragment.c();
    			t10 = space();
    			td4 = element("td");
    			renderdays.$$.fragment.c();
    			t11 = space();
    			td5 = element("td");
    			input = element("input");
    			t12 = space();
    			label = element("label");
    			t13 = text("✓");
    			t14 = space();
    			select = element("select");

    			for (var i_1 = 0; i_1 < each_blocks.length; i_1 += 1) {
    				each_blocks[i_1].c();
    			}

    			t15 = space();
    			if (if_block2) if_block2.c();
    			t16 = space();
    			if (if_block3) if_block3.c();
    			if_block3_anchor = empty();
    			attr(a, "href", a_href_value = "https://www.google.no/maps/?q=" + encodeURIComponent(ctx.itemData.adresseforhenting));
    			attr(a, "target", "_blank");
    			add_location(a, file$7, 131, 0, 2877);
    			add_location(br, file$7, 134, 0, 3017);
    			add_location(i, file$7, 136, 0, 3048);
    			attr(div, "class", "smallscreen svelte-1cd40x6");
    			add_location(div, file$7, 135, 0, 3022);
    			attr(td0, "tabindex", "0");
    			attr(td0, "class", "svelte-1cd40x6");
    			toggle_class(td0, "expanded", ctx.expanded);
    			toggle_class(td0, "loading", ctx.loading);
    			add_location(td0, file$7, 128, 0, 2697);
    			attr(td1, "class", "car svelte-1cd40x6");
    			add_location(td1, file$7, 139, 0, 3113);
    			attr(td2, "class", "typefilter svelte-1cd40x6");
    			add_location(td2, file$7, 146, 0, 3294);
    			attr(td3, "class", "svelte-1cd40x6");
    			add_location(td3, file$7, 147, 0, 3367);
    			attr(td4, "class", "svelte-1cd40x6");
    			add_location(td4, file$7, 148, 0, 3452);
    			attr(input, "type", "checkbox");
    			attr(input, "id", input_id_value = "select" + ctx.itemData.id);
    			attr(input, "class", "svelte-1cd40x6");
    			add_location(input, file$7, 156, 0, 3726);
    			attr(label, "for", label_for_value = "select" + ctx.itemData.id);
    			attr(label, "tabindex", "0");
    			attr(label, "class", "svelte-1cd40x6");
    			add_location(label, file$7, 157, 0, 3888);
    			if (ctx.itemData.status === void 0) add_render_callback(() => ctx.select_change_handler.call(select));
    			attr(select, "class", "svelte-1cd40x6");
    			add_location(select, file$7, 158, 0, 3944);
    			attr(td5, "class", "statuscell svelte-1cd40x6");
    			add_location(td5, file$7, 151, 0, 3528);
    			attr(tr, "class", "job svelte-1cd40x6");
    			attr(tr, "data-id", tr_data_id_value = ctx.itemData.id);
    			toggle_class(tr, "itemSelected", ctx.itemSelected);
    			add_location(tr, file$7, 124, 0, 2635);

    			dispose = [
    				listen(a, "click", stop_propagation(ctx.click_handler)),
    				listen(td0, "click", ctx.click_handler_1),
    				listen(input, "change", ctx.input_change_handler),
    				listen(input, "change", ctx.change_handler),
    				listen(select, "change", ctx.select_change_handler),
    				listen(select, "change", stop_propagation(ctx.change_handler_1)),
    				listen(td5, "click", ctx.click_handler_2)
    			];
    		},

    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},

    		m: function mount(target, anchor) {
    			insert(target, tr, anchor);
    			append(tr, td0);
    			if (if_block0) if_block0.m(td0, null);
    			append(td0, t0);
    			append(td0, t1);
    			append(td0, t2);
    			append(td0, a);
    			append(a, t3);
    			append(td0, t4);
    			append(td0, br);
    			append(td0, t5);
    			append(td0, div);
    			append(div, i);
    			append(i, t6);
    			append(tr, t7);
    			append(tr, td1);
    			if_block1.m(td1, null);
    			append(tr, t8);
    			append(tr, td2);
    			mount_component(rendertypes, td2, null);
    			append(tr, t9);
    			append(tr, td3);
    			mount_component(renderstars, td3, null);
    			append(tr, t10);
    			append(tr, td4);
    			mount_component(renderdays, td4, null);
    			append(tr, t11);
    			append(tr, td5);
    			append(td5, input);

    			input.checked = ctx.itemSelected;

    			append(td5, t12);
    			append(td5, label);
    			append(label, t13);
    			append(td5, t14);
    			append(td5, select);

    			for (var i_1 = 0; i_1 < each_blocks.length; i_1 += 1) {
    				each_blocks[i_1].m(select, null);
    			}

    			select_option(select, ctx.itemData.status);

    			append(td5, t15);
    			if (if_block2) if_block2.m(td5, null);
    			insert(target, t16, anchor);
    			if (if_block3) if_block3.m(target, anchor);
    			insert(target, if_block3_anchor, anchor);
    			current = true;
    		},

    		p: function update_1(changed, ctx) {
    			if (ctx.itemData.loading) {
    				if (!if_block0) {
    					if_block0 = create_if_block_4();
    					if_block0.c();
    					transition_in(if_block0, 1);
    					if_block0.m(td0, t0);
    				} else {
    									transition_in(if_block0, 1);
    				}
    			} else if (if_block0) {
    				group_outros();
    				transition_out(if_block0, 1, 1, () => {
    					if_block0 = null;
    				});
    				check_outros();
    			}

    			if ((!current || changed.itemData) && t1_value !== (t1_value = ctx.itemData.adresseforhenting + "")) {
    				set_data(t1, t1_value);
    			}

    			if ((!current || changed.itemData) && a_href_value !== (a_href_value = "https://www.google.no/maps/?q=" + encodeURIComponent(ctx.itemData.adresseforhenting))) {
    				attr(a, "href", a_href_value);
    			}

    			if ((!current || changed.itemData) && t6_value !== (t6_value = ctx.itemData.hentetidspunktkryssavsåmangedukan + "")) {
    				set_data(t6, t6_value);
    			}

    			if (changed.expanded) {
    				toggle_class(td0, "expanded", ctx.expanded);
    			}

    			if (changed.loading) {
    				toggle_class(td0, "loading", ctx.loading);
    			}

    			if (current_block_type !== (current_block_type = select_block_type(ctx))) {
    				if_block1.d(1);
    				if_block1 = current_block_type(ctx);
    				if (if_block1) {
    					if_block1.c();
    					if_block1.m(td1, null);
    				}
    			}

    			var rendertypes_changes = {};
    			if (changed.itemData) rendertypes_changes.types = ctx.itemData.typerlopper;
    			rendertypes.$set(rendertypes_changes);

    			var renderstars_changes = {};
    			if (changed.itemData) renderstars_changes.qualityRanking = ctx.itemData.kvalitet;
    			renderstars.$set(renderstars_changes);

    			var renderdays_changes = {};
    			if (changed.itemData) renderdays_changes.days = ctx.itemData.hentetidspunktkryssavsåmangedukan;
    			renderdays.$set(renderdays_changes);

    			if (changed.itemSelected) input.checked = ctx.itemSelected;

    			if ((!current || changed.itemData) && input_id_value !== (input_id_value = "select" + ctx.itemData.id)) {
    				attr(input, "id", input_id_value);
    			}

    			if ((!current || changed.itemData) && label_for_value !== (label_for_value = "select" + ctx.itemData.id)) {
    				attr(label, "for", label_for_value);
    			}

    			if (changed.states) {
    				each_value = states;

    				for (var i_1 = 0; i_1 < each_value.length; i_1 += 1) {
    					const child_ctx = get_each_context$3(ctx, each_value, i_1);

    					if (each_blocks[i_1]) {
    						each_blocks[i_1].p(changed, child_ctx);
    					} else {
    						each_blocks[i_1] = create_each_block$3(child_ctx);
    						each_blocks[i_1].c();
    						each_blocks[i_1].m(select, null);
    					}
    				}

    				for (; i_1 < each_blocks.length; i_1 += 1) {
    					each_blocks[i_1].d(1);
    				}
    				each_blocks.length = each_value.length;
    			}

    			if (changed.itemData) select_option(select, ctx.itemData.status);

    			if (ctx.itemData.hentesav) {
    				if (if_block2) {
    					if_block2.p(changed, ctx);
    				} else {
    					if_block2 = create_if_block_2(ctx);
    					if_block2.c();
    					if_block2.m(td5, null);
    				}
    			} else if (if_block2) {
    				if_block2.d(1);
    				if_block2 = null;
    			}

    			if ((!current || changed.itemData) && tr_data_id_value !== (tr_data_id_value = ctx.itemData.id)) {
    				attr(tr, "data-id", tr_data_id_value);
    			}

    			if (changed.itemSelected) {
    				toggle_class(tr, "itemSelected", ctx.itemSelected);
    			}

    			if (ctx.expanded) {
    				if (if_block3) {
    					if_block3.p(changed, ctx);
    					transition_in(if_block3, 1);
    				} else {
    					if_block3 = create_if_block$1(ctx);
    					if_block3.c();
    					transition_in(if_block3, 1);
    					if_block3.m(if_block3_anchor.parentNode, if_block3_anchor);
    				}
    			} else if (if_block3) {
    				group_outros();
    				transition_out(if_block3, 1, 1, () => {
    					if_block3 = null;
    				});
    				check_outros();
    			}
    		},

    		i: function intro(local) {
    			if (current) return;
    			transition_in(if_block0);

    			transition_in(rendertypes.$$.fragment, local);

    			transition_in(renderstars.$$.fragment, local);

    			transition_in(renderdays.$$.fragment, local);

    			transition_in(if_block3);
    			current = true;
    		},

    		o: function outro(local) {
    			transition_out(if_block0);
    			transition_out(rendertypes.$$.fragment, local);
    			transition_out(renderstars.$$.fragment, local);
    			transition_out(renderdays.$$.fragment, local);
    			transition_out(if_block3);
    			current = false;
    		},

    		d: function destroy(detaching) {
    			if (detaching) {
    				detach(tr);
    			}

    			if (if_block0) if_block0.d();
    			if_block1.d();

    			destroy_component(rendertypes);

    			destroy_component(renderstars);

    			destroy_component(renderdays);

    			destroy_each(each_blocks, detaching);

    			if (if_block2) if_block2.d();

    			if (detaching) {
    				detach(t16);
    			}

    			if (if_block3) if_block3.d(detaching);

    			if (detaching) {
    				detach(if_block3_anchor);
    			}

    			run_all(dispose);
    		}
    	};
    }

    function statusVerbString(state) {
    return state === 'Hentet' ? 'hentet' : 'henter nå';
    }

    function instance$7($$self, $$props, $$invalidate) {
    	let $drivers;

    	validate_store(drivers, 'drivers');
    	component_subscribe($$self, drivers, $$value => { $drivers = $$value; $$invalidate('$drivers', $drivers); });

    	

    const dispatch = createEventDispatcher();

    let { itemData, itemSelected = false } = $$props;
    let expanded = false;

    let showEditor = false;

    function update(event) {
    	$$invalidate('showEditor', showEditor = false);
    	return changeJobDetails(itemData.id, event.detail)
    	.catch(err => alert(err));
    }

    function getDriverName(number) {
    	let driver = $drivers.find(driver => driver.number === normalizeNumber(number));
    	 return driver ? driver.name : normalizeNumber(number);
    }

    	const writable_props = ['itemData', 'itemSelected'];
    	Object.keys($$props).forEach(key => {
    		if (!writable_props.includes(key) && !key.startsWith('$$')) console.warn(`<RenderJob> was created with unknown prop '${key}'`);
    	});

    	function click_handler(event) {
    		bubble($$self, event);
    	}

    	function click_handler_1(e) {
    		const $$result = expanded = !expanded;
    		$$invalidate('expanded', expanded);
    		return $$result;
    	}

    	function input_change_handler() {
    		itemSelected = this.checked;
    		$$invalidate('itemSelected', itemSelected);
    	}

    	function change_handler(e) {
    		return dispatch('select', {id: itemData.id, selected: e.target.checked});
    	}

    	function select_change_handler() {
    		itemData.status = select_value(this);
    		$$invalidate('itemData', itemData);
    		$$invalidate('states', states);
    	}

    	function change_handler_1(e) {
    		return update({detail: {status: e.target.value}});
    	}

    	function click_handler_2(e) {
    		if (['SELECT', 'LABEL', 'INPUT', 'OPTION', 'A'].indexOf(e.target.tagName) === -1) {
    			dispatch('select', {id: itemData.id, selected: !itemSelected});
    		}
    	}

    	function click_handler_3(e) {
    		const $$result = showEditor = true;
    		$$invalidate('showEditor', showEditor);
    		return $$result;
    	}

    	function cancel_handler(e) {
    		const $$result = showEditor = false;
    		$$invalidate('showEditor', showEditor);
    		return $$result;
    	}

    	function close_handler() {
    		const $$result = showEditor = false;
    		$$invalidate('showEditor', showEditor);
    		return $$result;
    	}

    	$$self.$set = $$props => {
    		if ('itemData' in $$props) $$invalidate('itemData', itemData = $$props.itemData);
    		if ('itemSelected' in $$props) $$invalidate('itemSelected', itemSelected = $$props.itemSelected);
    	};

    	let loading;

    	$$self.$$.update = ($$dirty = { itemData: 1 }) => {
    		if ($$dirty.itemData) { $$invalidate('loading', loading = itemData.loading); }
    	};

    	return {
    		dispatch,
    		itemData,
    		itemSelected,
    		expanded,
    		showEditor,
    		update,
    		getDriverName,
    		loading,
    		click_handler,
    		click_handler_1,
    		input_change_handler,
    		change_handler,
    		select_change_handler,
    		change_handler_1,
    		click_handler_2,
    		click_handler_3,
    		cancel_handler,
    		close_handler
    	};
    }

    class RenderJob extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$7, create_fragment$7, safe_not_equal, ["itemData", "itemSelected"]);

    		const { ctx } = this.$$;
    		const props = options.props || {};
    		if (ctx.itemData === undefined && !('itemData' in props)) {
    			console.warn("<RenderJob> was created without expected prop 'itemData'");
    		}
    	}

    	get itemData() {
    		throw new Error("<RenderJob>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set itemData(value) {
    		throw new Error("<RenderJob>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get itemSelected() {
    		throw new Error("<RenderJob>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set itemSelected(value) {
    		throw new Error("<RenderJob>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* client/src/components/SMSEditor.svelte generated by Svelte v3.8.0 */

    const file$8 = "client/src/components/SMSEditor.svelte";

    function get_each_context$4(ctx, list, i) {
    	const child_ctx = Object.create(ctx);
    	child_ctx.name = list[i];
    	return child_ctx;
    }

    function get_each_context_1(ctx, list, i) {
    	const child_ctx = Object.create(ctx);
    	child_ctx.recipient = list[i];
    	return child_ctx;
    }

    // (87:3) {:else}
    function create_else_block$1(ctx) {
    	var textarea, dispose;

    	return {
    		c: function create() {
    			textarea = element("textarea");
    			attr(textarea, "pattern", "[0-9 ,]");
    			textarea.required = true;
    			attr(textarea, "class", "svelte-72ojky");
    			add_location(textarea, file$8, 87, 4, 2833);
    			dispose = listen(textarea, "input", ctx.textarea_input_handler);
    		},

    		m: function mount(target, anchor) {
    			insert(target, textarea, anchor);

    			textarea.value = ctx.recipients;
    		},

    		p: function update(changed, ctx) {
    			if (changed.recipients) textarea.value = ctx.recipients;
    		},

    		d: function destroy(detaching) {
    			if (detaching) {
    				detach(textarea);
    			}

    			dispose();
    		}
    	};
    }

    // (79:3) {#if possibleRecipients && possibleRecipients.length}
    function create_if_block_1$2(ctx) {
    	var select, dispose;

    	var each_value_1 = ctx.possibleRecipients;

    	var each_blocks = [];

    	for (var i = 0; i < each_value_1.length; i += 1) {
    		each_blocks[i] = create_each_block_1(get_each_context_1(ctx, each_value_1, i));
    	}

    	return {
    		c: function create() {
    			select = element("select");

    			for (var i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}
    			if (ctx.recipients === void 0) add_render_callback(() => ctx.select_change_handler.call(select));
    			select.multiple = true;
    			select.required = true;
    			attr(select, "class", "svelte-72ojky");
    			add_location(select, file$8, 79, 4, 2564);
    			dispose = listen(select, "change", ctx.select_change_handler);
    		},

    		m: function mount(target, anchor) {
    			insert(target, select, anchor);

    			for (var i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(select, null);
    			}

    			select_options(select, ctx.recipients);
    		},

    		p: function update(changed, ctx) {
    			if (changed.possibleRecipients) {
    				each_value_1 = ctx.possibleRecipients;

    				for (var i = 0; i < each_value_1.length; i += 1) {
    					const child_ctx = get_each_context_1(ctx, each_value_1, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(changed, child_ctx);
    					} else {
    						each_blocks[i] = create_each_block_1(child_ctx);
    						each_blocks[i].c();
    						each_blocks[i].m(select, null);
    					}
    				}

    				for (; i < each_blocks.length; i += 1) {
    					each_blocks[i].d(1);
    				}
    				each_blocks.length = each_value_1.length;
    			}

    			if (changed.recipients) select_options(select, ctx.recipients);
    		},

    		d: function destroy(detaching) {
    			if (detaching) {
    				detach(select);
    			}

    			destroy_each(each_blocks, detaching);

    			dispose();
    		}
    	};
    }

    // (83:23) {#if recipient.address}
    function create_if_block_2$1(ctx) {
    	var t0, t1_value = ctx.recipient.address + "", t1;

    	return {
    		c: function create() {
    			t0 = text("- ");
    			t1 = text(t1_value);
    		},

    		m: function mount(target, anchor) {
    			insert(target, t0, anchor);
    			insert(target, t1, anchor);
    		},

    		p: function update(changed, ctx) {
    			if ((changed.possibleRecipients) && t1_value !== (t1_value = ctx.recipient.address + "")) {
    				set_data(t1, t1_value);
    			}
    		},

    		d: function destroy(detaching) {
    			if (detaching) {
    				detach(t0);
    				detach(t1);
    			}
    		}
    	};
    }

    // (81:5) {#each possibleRecipients as recipient}
    function create_each_block_1(ctx) {
    	var option, t0_value = ctx.recipient.name + "", t0, t1, option_value_value;

    	var if_block = (ctx.recipient.address) && create_if_block_2$1(ctx);

    	return {
    		c: function create() {
    			option = element("option");
    			t0 = text(t0_value);
    			if (if_block) if_block.c();
    			t1 = space();
    			option.__value = option_value_value = ctx.recipient.number;
    			option.value = option.__value;
    			attr(option, "class", "svelte-72ojky");
    			add_location(option, file$8, 81, 6, 2666);
    		},

    		m: function mount(target, anchor) {
    			insert(target, option, anchor);
    			append(option, t0);
    			if (if_block) if_block.m(option, null);
    			append(option, t1);
    		},

    		p: function update(changed, ctx) {
    			if ((changed.possibleRecipients) && t0_value !== (t0_value = ctx.recipient.name + "")) {
    				set_data(t0, t0_value);
    			}

    			if (ctx.recipient.address) {
    				if (if_block) {
    					if_block.p(changed, ctx);
    				} else {
    					if_block = create_if_block_2$1(ctx);
    					if_block.c();
    					if_block.m(option, t1);
    				}
    			} else if (if_block) {
    				if_block.d(1);
    				if_block = null;
    			}

    			if ((changed.possibleRecipients) && option_value_value !== (option_value_value = ctx.recipient.number)) {
    				option.__value = option_value_value;
    			}

    			option.value = option.__value;
    		},

    		d: function destroy(detaching) {
    			if (detaching) {
    				detach(option);
    			}

    			if (if_block) if_block.d();
    		}
    	};
    }

    // (99:1) {#if showQuickReplies}
    function create_if_block$2(ctx) {
    	var p, b, t_1, span, select, option, dispose;

    	var each_value = Object.keys(ctx.stdMessages);

    	var each_blocks = [];

    	for (var i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block$4(get_each_context$4(ctx, each_value, i));
    	}

    	return {
    		c: function create() {
    			p = element("p");
    			b = element("b");
    			b.textContent = "Kjappe svar";
    			t_1 = space();
    			span = element("span");
    			select = element("select");
    			option = element("option");

    			for (var i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}
    			add_location(b, file$8, 100, 2, 3073);
    			option.__value = "";
    			option.value = option.__value;
    			attr(option, "class", "svelte-72ojky");
    			add_location(option, file$8, 103, 4, 3161);
    			attr(select, "class", "svelte-72ojky");
    			add_location(select, file$8, 102, 3, 3104);
    			attr(span, "class", "svelte-72ojky");
    			add_location(span, file$8, 101, 2, 3094);
    			attr(p, "class", "svelte-72ojky");
    			add_location(p, file$8, 99, 1, 3067);
    			dispose = listen(select, "change", ctx.change_handler);
    		},

    		m: function mount(target, anchor) {
    			insert(target, p, anchor);
    			append(p, b);
    			append(p, t_1);
    			append(p, span);
    			append(span, select);
    			append(select, option);

    			for (var i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(select, null);
    			}
    		},

    		p: function update(changed, ctx) {
    			if (changed.stdMessages) {
    				each_value = Object.keys(ctx.stdMessages);

    				for (var i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context$4(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(changed, child_ctx);
    					} else {
    						each_blocks[i] = create_each_block$4(child_ctx);
    						each_blocks[i].c();
    						each_blocks[i].m(select, null);
    					}
    				}

    				for (; i < each_blocks.length; i += 1) {
    					each_blocks[i].d(1);
    				}
    				each_blocks.length = each_value.length;
    			}
    		},

    		d: function destroy(detaching) {
    			if (detaching) {
    				detach(p);
    			}

    			destroy_each(each_blocks, detaching);

    			dispose();
    		}
    	};
    }

    // (105:4) {#each Object.keys(stdMessages) as name}
    function create_each_block$4(ctx) {
    	var option, t_value = ctx.name + "", t, option_value_value;

    	return {
    		c: function create() {
    			option = element("option");
    			t = text(t_value);
    			option.__value = option_value_value = ctx.name;
    			option.value = option.__value;
    			attr(option, "class", "svelte-72ojky");
    			add_location(option, file$8, 105, 5, 3229);
    		},

    		m: function mount(target, anchor) {
    			insert(target, option, anchor);
    			append(option, t);
    		},

    		p: function update(changed, ctx) {
    			option.value = option.__value;
    		},

    		d: function destroy(detaching) {
    			if (detaching) {
    				detach(option);
    			}
    		}
    	};
    }

    function create_fragment$8(ctx) {
    	var form, p0, b0, span0, t1, p1, b1, t3, span1, textarea, t4, t5, p2, span2, t6, span3, button0, t8, button1, dispose;

    	function select_block_type(ctx) {
    		if (ctx.possibleRecipients && ctx.possibleRecipients.length) return create_if_block_1$2;
    		return create_else_block$1;
    	}

    	var current_block_type = select_block_type(ctx);
    	var if_block0 = current_block_type(ctx);

    	var if_block1 = (ctx.showQuickReplies) && create_if_block$2(ctx);

    	return {
    		c: function create() {
    			form = element("form");
    			p0 = element("p");
    			b0 = element("b");
    			b0.textContent = "Til";
    			span0 = element("span");
    			if_block0.c();
    			t1 = space();
    			p1 = element("p");
    			b1 = element("b");
    			b1.textContent = "SMS";
    			t3 = space();
    			span1 = element("span");
    			textarea = element("textarea");
    			t4 = space();
    			if (if_block1) if_block1.c();
    			t5 = space();
    			p2 = element("p");
    			span2 = element("span");
    			t6 = space();
    			span3 = element("span");
    			button0 = element("button");
    			button0.textContent = "Send";
    			t8 = space();
    			button1 = element("button");
    			button1.textContent = "Avbryt";
    			add_location(b0, file$8, 77, 2, 2475);
    			attr(span0, "class", "to svelte-72ojky");
    			add_location(span0, file$8, 77, 12, 2485);
    			attr(p0, "class", "svelte-72ojky");
    			add_location(p0, file$8, 76, 1, 2469);
    			add_location(b1, file$8, 92, 2, 2938);
    			textarea.required = true;
    			attr(textarea, "class", "svelte-72ojky");
    			add_location(textarea, file$8, 94, 3, 2973);
    			attr(span1, "class", "sms svelte-72ojky");
    			add_location(span1, file$8, 93, 2, 2951);
    			attr(p1, "class", "svelte-72ojky");
    			add_location(p1, file$8, 91, 1, 2932);
    			attr(span2, "class", "svelte-72ojky");
    			add_location(span2, file$8, 112, 4, 3307);
    			attr(button0, "type", "submit");
    			attr(button0, "class", "p8 br2 svelte-72ojky");
    			add_location(button0, file$8, 114, 3, 3333);
    			attr(button1, "class", "p8 br2 svelte-72ojky");
    			attr(button1, "type", "button");
    			add_location(button1, file$8, 115, 3, 3388);
    			attr(span3, "class", "svelte-72ojky");
    			add_location(span3, file$8, 113, 2, 3323);
    			attr(p2, "class", "svelte-72ojky");
    			add_location(p2, file$8, 112, 1, 3304);
    			attr(form, "class", "svelte-72ojky");
    			add_location(form, file$8, 75, 0, 2422);

    			dispose = [
    				listen(textarea, "input", ctx.textarea_input_handler_1),
    				listen(button1, "click", ctx.click_handler),
    				listen(form, "submit", prevent_default(ctx.submit_handler))
    			];
    		},

    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},

    		m: function mount(target, anchor) {
    			insert(target, form, anchor);
    			append(form, p0);
    			append(p0, b0);
    			append(p0, span0);
    			if_block0.m(span0, null);
    			append(form, t1);
    			append(form, p1);
    			append(p1, b1);
    			append(p1, t3);
    			append(p1, span1);
    			append(span1, textarea);

    			textarea.value = ctx.message;

    			append(form, t4);
    			if (if_block1) if_block1.m(form, null);
    			append(form, t5);
    			append(form, p2);
    			append(p2, span2);
    			append(p2, t6);
    			append(p2, span3);
    			append(span3, button0);
    			append(span3, t8);
    			append(span3, button1);
    		},

    		p: function update(changed, ctx) {
    			if (current_block_type === (current_block_type = select_block_type(ctx)) && if_block0) {
    				if_block0.p(changed, ctx);
    			} else {
    				if_block0.d(1);
    				if_block0 = current_block_type(ctx);
    				if (if_block0) {
    					if_block0.c();
    					if_block0.m(span0, null);
    				}
    			}

    			if (changed.message) textarea.value = ctx.message;

    			if (ctx.showQuickReplies) {
    				if (if_block1) {
    					if_block1.p(changed, ctx);
    				} else {
    					if_block1 = create_if_block$2(ctx);
    					if_block1.c();
    					if_block1.m(form, t5);
    				}
    			} else if (if_block1) {
    				if_block1.d(1);
    				if_block1 = null;
    			}
    		},

    		i: noop,
    		o: noop,

    		d: function destroy(detaching) {
    			if (detaching) {
    				detach(form);
    			}

    			if_block0.d();
    			if (if_block1) if_block1.d();
    			run_all(dispose);
    		}
    	};
    }

    function instance$8($$self, $$props, $$invalidate) {
    	let { recipients = [], message = '', possibleRecipients } = $$props;

    let showQuickReplies = !message;
    const dispatch = createEventDispatcher();

    let stdMessages = {
    	'Bekreft data mottatt': 'Hei,\ntakk for at du har sendt inn skjema om loppehenting! :)\n\nVi henter hver kveld mellom 27. og 29. august (*ikke* september som det dessverre står på noen plakater). Vi kontakter deg på dette nummeret før henting.\n\nVennlig hilsen Ila og Bolteløkka skolekorps',
    	'Hentes snart': 'Hei,\ntakk for at du vil gi korpset lopper. Passer det om noen kommer og henter hos deg snart?\n\nVennlig hilsen Ila og Bolteløkka skolekorps',
    	'Ikke IKEA': 'Hei,\ntakk for at du vil gi korpset lopper! Dessverre har vi dårlig erfaring med å selge IKEA-møbler, så slike vil vi helst ikke ta imot.\n\nVennlig hilsen Ila og Bolteløkka skolekorps',
    	'Ikke sofa': 'Hei,\ntakk for at du vil gi korpset lopper! Dessverre har vi dårlig erfaring med å selge sofaer på loppemarked. Vi vil helst ikke ta imot sofaer med mindre de er av spesielt god kvalitet.\n\nVennlig hilsen Ila og Bolteløkka skolekorps',
    	'Rekker ikke': 'Hei,\ntakk for at du vil gi korpset lopper! Dessverre rekker vi ikke å hente loppene dine i kveld. Dersom du har mulighet til å lever i skolegården, er det supert.\n\nVennlig hilsen Ila og Bolteløkka skolekorps',
    	'Send foto?': 'Hei,\ntakk for at du vil gi korpset lopper! Kan du sende meg et foto av loppene?\n\nVennlig hilsen Ila og Bolteløkka skolekorps',
    };

    function send() {
    	if (typeof recipients === 'string') {
    		dispatch('sms', {
    			recipients: recipients.split(/,\s*/g),
    			message,
    		});
    	} else {
    		dispatch('sms', {
    			recipients,
    			message,
    		});		
    	}
    }

    function addMessage(name) {
    	if (name && stdMessages[name]) {
    		$$invalidate('message', message = stdMessages[name]);
    	}
    }

    	const writable_props = ['recipients', 'message', 'possibleRecipients'];
    	Object.keys($$props).forEach(key => {
    		if (!writable_props.includes(key) && !key.startsWith('$$')) console.warn(`<SMSEditor> was created with unknown prop '${key}'`);
    	});

    	function select_change_handler() {
    		recipients = select_multiple_value(this);
    		$$invalidate('recipients', recipients);
    		$$invalidate('possibleRecipients', possibleRecipients);
    	}

    	function textarea_input_handler() {
    		recipients = this.value;
    		$$invalidate('recipients', recipients);
    		$$invalidate('possibleRecipients', possibleRecipients);
    	}

    	function textarea_input_handler_1() {
    		message = this.value;
    		$$invalidate('message', message);
    	}

    	function change_handler(e) {
    		return addMessage(e.target.value);
    	}

    	function click_handler(e) {
    		return dispatch('cancel');
    	}

    	function submit_handler(e) {
    		return send();
    	}

    	$$self.$set = $$props => {
    		if ('recipients' in $$props) $$invalidate('recipients', recipients = $$props.recipients);
    		if ('message' in $$props) $$invalidate('message', message = $$props.message);
    		if ('possibleRecipients' in $$props) $$invalidate('possibleRecipients', possibleRecipients = $$props.possibleRecipients);
    	};

    	return {
    		recipients,
    		message,
    		possibleRecipients,
    		showQuickReplies,
    		dispatch,
    		stdMessages,
    		send,
    		addMessage,
    		select_change_handler,
    		textarea_input_handler,
    		textarea_input_handler_1,
    		change_handler,
    		click_handler,
    		submit_handler
    	};
    }

    class SMSEditor extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$8, create_fragment$8, safe_not_equal, ["recipients", "message", "possibleRecipients"]);

    		const { ctx } = this.$$;
    		const props = options.props || {};
    		if (ctx.possibleRecipients === undefined && !('possibleRecipients' in props)) {
    			console.warn("<SMSEditor> was created without expected prop 'possibleRecipients'");
    		}
    	}

    	get recipients() {
    		throw new Error("<SMSEditor>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set recipients(value) {
    		throw new Error("<SMSEditor>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get message() {
    		throw new Error("<SMSEditor>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set message(value) {
    		throw new Error("<SMSEditor>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get possibleRecipients() {
    		throw new Error("<SMSEditor>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set possibleRecipients(value) {
    		throw new Error("<SMSEditor>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* client/src/components/DriverEditor.svelte generated by Svelte v3.8.0 */

    const file$9 = "client/src/components/DriverEditor.svelte";

    function get_each_context$5(ctx, list, i) {
    	const child_ctx = Object.create(ctx);
    	child_ctx.name = list[i].name;
    	child_ctx.number = list[i].number;
    	return child_ctx;
    }

    // (60:2) {#if $drivers.length}
    function create_if_block$3(ctx) {
    	var ul;

    	var each_value = ctx.$drivers;

    	var each_blocks = [];

    	for (var i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block$5(get_each_context$5(ctx, each_value, i));
    	}

    	return {
    		c: function create() {
    			ul = element("ul");

    			for (var i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}
    			add_location(ul, file$9, 60, 2, 1070);
    		},

    		m: function mount(target, anchor) {
    			insert(target, ul, anchor);

    			for (var i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(ul, null);
    			}
    		},

    		p: function update(changed, ctx) {
    			if (changed.$drivers) {
    				each_value = ctx.$drivers;

    				for (var i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context$5(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(changed, child_ctx);
    					} else {
    						each_blocks[i] = create_each_block$5(child_ctx);
    						each_blocks[i].c();
    						each_blocks[i].m(ul, null);
    					}
    				}

    				for (; i < each_blocks.length; i += 1) {
    					each_blocks[i].d(1);
    				}
    				each_blocks.length = each_value.length;
    			}
    		},

    		d: function destroy(detaching) {
    			if (detaching) {
    				detach(ul);
    			}

    			destroy_each(each_blocks, detaching);
    		}
    	};
    }

    // (62:2) {#each $drivers as {name, number}}
    function create_each_block$5(ctx) {
    	var li, b, t0_value = ctx.name + "", t0, t1, a, t2_value = ctx.number + "", t2, a_href_value, t3, button, dispose;

    	function click_handler(...args) {
    		return ctx.click_handler(ctx, ...args);
    	}

    	return {
    		c: function create() {
    			li = element("li");
    			b = element("b");
    			t0 = text(t0_value);
    			t1 = text(", ");
    			a = element("a");
    			t2 = text(t2_value);
    			t3 = space();
    			button = element("button");
    			button.textContent = "X";
    			add_location(b, file$9, 62, 7, 1119);
    			attr(a, "href", a_href_value = "tel:" + ctx.number);
    			add_location(a, file$9, 62, 22, 1134);
    			attr(button, "class", "cancel br2 svelte-4kixmb");
    			add_location(button, file$9, 63, 4, 1175);
    			add_location(li, file$9, 62, 3, 1115);
    			dispose = listen(button, "click", click_handler);
    		},

    		m: function mount(target, anchor) {
    			insert(target, li, anchor);
    			append(li, b);
    			append(b, t0);
    			append(li, t1);
    			append(li, a);
    			append(a, t2);
    			append(li, t3);
    			append(li, button);
    		},

    		p: function update(changed, new_ctx) {
    			ctx = new_ctx;
    			if ((changed.$drivers) && t0_value !== (t0_value = ctx.name + "")) {
    				set_data(t0, t0_value);
    			}

    			if ((changed.$drivers) && t2_value !== (t2_value = ctx.number + "")) {
    				set_data(t2, t2_value);
    			}

    			if ((changed.$drivers) && a_href_value !== (a_href_value = "tel:" + ctx.number)) {
    				attr(a, "href", a_href_value);
    			}
    		},

    		d: function destroy(detaching) {
    			if (detaching) {
    				detach(li);
    			}

    			dispose();
    		}
    	};
    }

    function create_fragment$9(ctx) {
    	var div, t0, form, p0, span0, span1, input0, t2, p1, span2, span3, input1, t4, p2, span4, span5, button0, t6, button1, dispose;

    	var if_block = (ctx.$drivers.length) && create_if_block$3(ctx);

    	return {
    		c: function create() {
    			div = element("div");
    			if (if_block) if_block.c();
    			t0 = space();
    			form = element("form");
    			p0 = element("p");
    			span0 = element("span");
    			span0.textContent = "Navn: ";
    			span1 = element("span");
    			input0 = element("input");
    			t2 = space();
    			p1 = element("p");
    			span2 = element("span");
    			span2.textContent = "Mobil: ";
    			span3 = element("span");
    			input1 = element("input");
    			t4 = space();
    			p2 = element("p");
    			span4 = element("span");
    			span5 = element("span");
    			button0 = element("button");
    			button0.textContent = "Legg til";
    			t6 = space();
    			button1 = element("button");
    			button1.textContent = "Lukk";
    			attr(span0, "class", "svelte-4kixmb");
    			add_location(span0, file$9, 70, 2, 1370);
    			input0.required = true;
    			attr(input0, "class", "svelte-4kixmb");
    			add_location(input0, file$9, 70, 27, 1395);
    			attr(span1, "class", "svelte-4kixmb");
    			add_location(span1, file$9, 70, 21, 1389);
    			attr(p0, "class", "svelte-4kixmb");
    			add_location(p0, file$9, 69, 2, 1364);
    			attr(span2, "class", "svelte-4kixmb");
    			add_location(span2, file$9, 73, 2, 1455);
    			attr(input1, "inputmode", "tel");
    			input1.required = true;
    			attr(input1, "class", "svelte-4kixmb");
    			add_location(input1, file$9, 73, 28, 1481);
    			attr(span3, "class", "svelte-4kixmb");
    			add_location(span3, file$9, 73, 22, 1475);
    			attr(p1, "class", "svelte-4kixmb");
    			add_location(p1, file$9, 72, 2, 1449);
    			attr(span4, "class", "svelte-4kixmb");
    			add_location(span4, file$9, 75, 5, 1556);
    			attr(button0, "type", "submit");
    			attr(button0, "class", "p8 br2 svelte-4kixmb");
    			add_location(button0, file$9, 76, 3, 1579);
    			attr(button1, "class", "p8 br2 svelte-4kixmb");
    			attr(button1, "type", "button");
    			add_location(button1, file$9, 77, 3, 1637);
    			attr(span5, "class", "svelte-4kixmb");
    			add_location(span5, file$9, 75, 18, 1569);
    			attr(p2, "class", "svelte-4kixmb");
    			add_location(p2, file$9, 75, 2, 1553);
    			attr(form, "class", "svelte-4kixmb");
    			add_location(form, file$9, 68, 1, 1289);
    			add_location(div, file$9, 58, 0, 1038);

    			dispose = [
    				listen(input0, "input", ctx.input0_input_handler),
    				listen(input1, "input", ctx.input1_input_handler),
    				listen(button1, "click", ctx.click_handler_1),
    				listen(form, "submit", prevent_default(ctx.submit_handler))
    			];
    		},

    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},

    		m: function mount(target, anchor) {
    			insert(target, div, anchor);
    			if (if_block) if_block.m(div, null);
    			append(div, t0);
    			append(div, form);
    			append(form, p0);
    			append(p0, span0);
    			append(p0, span1);
    			append(span1, input0);

    			input0.value = ctx.addName;

    			append(form, t2);
    			append(form, p1);
    			append(p1, span2);
    			append(p1, span3);
    			append(span3, input1);

    			input1.value = ctx.addNumber;

    			append(form, t4);
    			append(form, p2);
    			append(p2, span4);
    			append(p2, span5);
    			append(span5, button0);
    			append(span5, t6);
    			append(span5, button1);
    		},

    		p: function update(changed, ctx) {
    			if (ctx.$drivers.length) {
    				if (if_block) {
    					if_block.p(changed, ctx);
    				} else {
    					if_block = create_if_block$3(ctx);
    					if_block.c();
    					if_block.m(div, t0);
    				}
    			} else if (if_block) {
    				if_block.d(1);
    				if_block = null;
    			}

    			if (changed.addName && (input0.value !== ctx.addName)) input0.value = ctx.addName;
    			if (changed.addNumber && (input1.value !== ctx.addNumber)) input1.value = ctx.addNumber;
    		},

    		i: noop,
    		o: noop,

    		d: function destroy(detaching) {
    			if (detaching) {
    				detach(div);
    			}

    			if (if_block) if_block.d();
    			run_all(dispose);
    		}
    	};
    }

    function removeDriver(name, number) {
    	drivers.update(drivers => {
    		let idx = drivers.findIndex(driver => driver.name === name && driver.number === number);
    		drivers.splice(idx, 1);
    		return drivers;
    	});
    }

    function instance$9($$self, $$props, $$invalidate) {
    	let $drivers;

    	validate_store(drivers, 'drivers');
    	component_subscribe($$self, drivers, $$value => { $drivers = $$value; $$invalidate('$drivers', $drivers); });

    	
    	const dispatch = createEventDispatcher();
    	let addName = '';
    	let addNumber = '';

    	function createDriver(name, number) {
    		drivers.update(drivers => {
    			drivers.push({name, number});
    			return drivers;
    		});
    		$$invalidate('addNumber', addNumber = addName = ''); $$invalidate('addName', addName);
    	}

    	function click_handler({ name, number }, e) {
    		return removeDriver(name, number);
    	}

    	function input0_input_handler() {
    		addName = this.value;
    		$$invalidate('addName', addName);
    	}

    	function input1_input_handler() {
    		addNumber = this.value;
    		$$invalidate('addNumber', addNumber);
    	}

    	function click_handler_1(e) {
    		return dispatch('cancel');
    	}

    	function submit_handler(e) {
    		return createDriver(addName, addNumber);
    	}

    	return {
    		dispatch,
    		addName,
    		addNumber,
    		createDriver,
    		$drivers,
    		click_handler,
    		input0_input_handler,
    		input1_input_handler,
    		click_handler_1,
    		submit_handler
    	};
    }

    class DriverEditor extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$9, create_fragment$9, safe_not_equal, []);
    	}
    }

    /* client/src/components/StateEditor.svelte generated by Svelte v3.8.0 */

    const file$a = "client/src/components/StateEditor.svelte";

    function get_each_context$6(ctx, list, i) {
    	const child_ctx = Object.create(ctx);
    	child_ctx.theState = list[i];
    	return child_ctx;
    }

    // (49:4) {#each states as theState}
    function create_each_block$6(ctx) {
    	var option, t_value = ctx.theState + "", t, option_value_value;

    	return {
    		c: function create() {
    			option = element("option");
    			t = text(t_value);
    			option.__value = option_value_value = ctx.theState;
    			option.value = option.__value;
    			attr(option, "class", "svelte-1j620z1");
    			add_location(option, file$a, 49, 5, 858);
    		},

    		m: function mount(target, anchor) {
    			insert(target, option, anchor);
    			append(option, t);
    		},

    		p: function update(changed, ctx) {
    			option.value = option.__value;
    		},

    		d: function destroy(detaching) {
    			if (detaching) {
    				detach(option);
    			}
    		}
    	};
    }

    function create_fragment$a(ctx) {
    	var form, p0, b, t1, span0, select, t2, p1, span1, t3, span2, button0, t5, button1, dispose;

    	var each_value = states;

    	var each_blocks = [];

    	for (var i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block$6(get_each_context$6(ctx, each_value, i));
    	}

    	return {
    		c: function create() {
    			form = element("form");
    			p0 = element("p");
    			b = element("b");
    			b.textContent = "Ny status:";
    			t1 = space();
    			span0 = element("span");
    			select = element("select");

    			for (var i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			t2 = space();
    			p1 = element("p");
    			span1 = element("span");
    			t3 = space();
    			span2 = element("span");
    			button0 = element("button");
    			button0.textContent = "Oppdater valgte";
    			t5 = space();
    			button1 = element("button");
    			button1.textContent = "Avbryt";
    			attr(b, "class", "svelte-1j620z1");
    			add_location(b, file$a, 45, 2, 760);
    			if (ctx.newState === void 0) add_render_callback(() => ctx.select_change_handler.call(select));
    			attr(select, "class", "svelte-1j620z1");
    			add_location(select, file$a, 47, 3, 791);
    			attr(span0, "class", "svelte-1j620z1");
    			add_location(span0, file$a, 46, 2, 781);
    			attr(p0, "class", "svelte-1j620z1");
    			add_location(p0, file$a, 44, 1, 754);
    			attr(span1, "class", "svelte-1j620z1");
    			add_location(span1, file$a, 55, 2, 937);
    			attr(button0, "type", "submit");
    			attr(button0, "class", "p8 br2 svelte-1j620z1");
    			add_location(button0, file$a, 57, 3, 963);
    			attr(button1, "class", "p8 br2 svelte-1j620z1");
    			attr(button1, "type", "button");
    			add_location(button1, file$a, 58, 3, 1029);
    			attr(span2, "class", "svelte-1j620z1");
    			add_location(span2, file$a, 56, 2, 953);
    			attr(p1, "class", "svelte-1j620z1");
    			add_location(p1, file$a, 54, 1, 931);
    			attr(form, "class", "svelte-1j620z1");
    			add_location(form, file$a, 43, 0, 707);

    			dispose = [
    				listen(select, "change", ctx.select_change_handler),
    				listen(button1, "click", ctx.click_handler),
    				listen(form, "submit", prevent_default(ctx.submit_handler))
    			];
    		},

    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},

    		m: function mount(target, anchor) {
    			insert(target, form, anchor);
    			append(form, p0);
    			append(p0, b);
    			append(p0, t1);
    			append(p0, span0);
    			append(span0, select);

    			for (var i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(select, null);
    			}

    			select_option(select, ctx.newState);

    			append(form, t2);
    			append(form, p1);
    			append(p1, span1);
    			append(p1, t3);
    			append(p1, span2);
    			append(span2, button0);
    			append(span2, t5);
    			append(span2, button1);
    		},

    		p: function update(changed, ctx) {
    			if (changed.states) {
    				each_value = states;

    				for (var i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context$6(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(changed, child_ctx);
    					} else {
    						each_blocks[i] = create_each_block$6(child_ctx);
    						each_blocks[i].c();
    						each_blocks[i].m(select, null);
    					}
    				}

    				for (; i < each_blocks.length; i += 1) {
    					each_blocks[i].d(1);
    				}
    				each_blocks.length = each_value.length;
    			}

    			if (changed.newState) select_option(select, ctx.newState);
    		},

    		i: noop,
    		o: noop,

    		d: function destroy(detaching) {
    			if (detaching) {
    				detach(form);
    			}

    			destroy_each(each_blocks, detaching);

    			run_all(dispose);
    		}
    	};
    }

    function instance$a($$self, $$props, $$invalidate) {
    	
    const dispatch = createEventDispatcher();
    let newState = '';
    function send() {
    	dispatch('statusupdate', {
    		newState,
    	});
    }

    	function select_change_handler() {
    		newState = select_value(this);
    		$$invalidate('newState', newState);
    		$$invalidate('states', states);
    	}

    	function click_handler(e) {
    		return dispatch('cancel');
    	}

    	function submit_handler(e) {
    		return send();
    	}

    	return {
    		dispatch,
    		newState,
    		send,
    		select_change_handler,
    		click_handler,
    		submit_handler
    	};
    }

    class StateEditor extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$a, create_fragment$a, safe_not_equal, []);
    	}
    }

    /* client/src/components/FlashMessage.svelte generated by Svelte v3.8.0 */

    const file$b = "client/src/components/FlashMessage.svelte";

    function create_fragment$b(ctx) {
    	var div, t, div_transition, current;

    	return {
    		c: function create() {
    			div = element("div");
    			t = text(ctx.message);
    			set_style(div, "bottom", "" + 36 * ctx.index + "px");
    			attr(div, "class", "svelte-ni4itl");
    			toggle_class(div, "isError", ctx.isError);
    			add_location(div, file$b, 24, 0, 406);
    		},

    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},

    		m: function mount(target, anchor) {
    			insert(target, div, anchor);
    			append(div, t);
    			current = true;
    		},

    		p: function update(changed, ctx) {
    			if (!current || changed.message) {
    				set_data(t, ctx.message);
    			}

    			if (!current || changed.index) {
    				set_style(div, "bottom", "" + 36 * ctx.index + "px");
    			}

    			if (changed.isError) {
    				toggle_class(div, "isError", ctx.isError);
    			}
    		},

    		i: function intro(local) {
    			if (current) return;
    			add_render_callback(() => {
    				if (!div_transition) div_transition = create_bidirectional_transition(div, fly, { y: 50, duration: 500 }, true);
    				div_transition.run(1);
    			});

    			current = true;
    		},

    		o: function outro(local) {
    			if (!div_transition) div_transition = create_bidirectional_transition(div, fly, { y: 50, duration: 500 }, false);
    			div_transition.run(0);

    			current = false;
    		},

    		d: function destroy(detaching) {
    			if (detaching) {
    				detach(div);
    				if (div_transition) div_transition.end();
    			}
    		}
    	};
    }

    function instance$b($$self, $$props, $$invalidate) {
    	let { message = '', isError = false, index = 0 } = $$props;

    	const writable_props = ['message', 'isError', 'index'];
    	Object.keys($$props).forEach(key => {
    		if (!writable_props.includes(key) && !key.startsWith('$$')) console.warn(`<FlashMessage> was created with unknown prop '${key}'`);
    	});

    	$$self.$set = $$props => {
    		if ('message' in $$props) $$invalidate('message', message = $$props.message);
    		if ('isError' in $$props) $$invalidate('isError', isError = $$props.isError);
    		if ('index' in $$props) $$invalidate('index', index = $$props.index);
    	};

    	return { message, isError, index };
    }

    class FlashMessage extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$b, create_fragment$b, safe_not_equal, ["message", "isError", "index"]);
    	}

    	get message() {
    		throw new Error("<FlashMessage>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set message(value) {
    		throw new Error("<FlashMessage>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get isError() {
    		throw new Error("<FlashMessage>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set isError(value) {
    		throw new Error("<FlashMessage>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get index() {
    		throw new Error("<FlashMessage>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set index(value) {
    		throw new Error("<FlashMessage>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* client/src/components/Menu.svelte generated by Svelte v3.8.0 */

    const file$c = "client/src/components/Menu.svelte";

    function get_each_context$7(ctx, list, i) {
    	const child_ctx = Object.create(ctx);
    	child_ctx.item = list[i];
    	return child_ctx;
    }

    // (50:3) {#if item.icon}
    function create_if_block$4(ctx) {
    	var img, img_src_value;

    	return {
    		c: function create() {
    			img = element("img");
    			attr(img, "src", img_src_value = ctx.item.icon);
    			attr(img, "alt", "");
    			attr(img, "class", "svelte-1s9tfhz");
    			add_location(img, file$c, 49, 18, 924);
    		},

    		m: function mount(target, anchor) {
    			insert(target, img, anchor);
    		},

    		p: function update(changed, ctx) {
    			if ((changed.items) && img_src_value !== (img_src_value = ctx.item.icon)) {
    				attr(img, "src", img_src_value);
    			}
    		},

    		d: function destroy(detaching) {
    			if (detaching) {
    				detach(img);
    			}
    		}
    	};
    }

    // (48:1) {#each items as item}
    function create_each_block$7(ctx) {
    	var button, t0, t1_value = ctx.item.label + "", t1, t2, dispose;

    	var if_block = (ctx.item.icon) && create_if_block$4(ctx);

    	return {
    		c: function create() {
    			button = element("button");
    			if (if_block) if_block.c();
    			t0 = space();
    			t1 = text(t1_value);
    			t2 = space();
    			attr(button, "class", "menu svelte-1s9tfhz");
    			add_location(button, file$c, 48, 2, 861);
    			dispose = listen(button, "click", ctx.item.action);
    		},

    		m: function mount(target, anchor) {
    			insert(target, button, anchor);
    			if (if_block) if_block.m(button, null);
    			append(button, t0);
    			append(button, t1);
    			append(button, t2);
    		},

    		p: function update(changed, new_ctx) {
    			ctx = new_ctx;
    			if (ctx.item.icon) {
    				if (if_block) {
    					if_block.p(changed, ctx);
    				} else {
    					if_block = create_if_block$4(ctx);
    					if_block.c();
    					if_block.m(button, t0);
    				}
    			} else if (if_block) {
    				if_block.d(1);
    				if_block = null;
    			}

    			if ((changed.items) && t1_value !== (t1_value = ctx.item.label + "")) {
    				set_data(t1, t1_value);
    			}
    		},

    		d: function destroy(detaching) {
    			if (detaching) {
    				detach(button);
    			}

    			if (if_block) if_block.d();
    			dispose();
    		}
    	};
    }

    function create_fragment$c(ctx) {
    	var div;

    	var each_value = ctx.items;

    	var each_blocks = [];

    	for (var i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block$7(get_each_context$7(ctx, each_value, i));
    	}

    	return {
    		c: function create() {
    			div = element("div");

    			for (var i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}
    			attr(div, "class", "menu svelte-1s9tfhz");
    			set_style(div, "top", "" + ctx.y + "px");
    			set_style(div, "left", "" + ctx.x + "px");
    			set_style(div, "position", "fixed");
    			toggle_class(div, "show", ctx.show);
    			add_location(div, file$c, 46, 0, 756);
    		},

    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},

    		m: function mount(target, anchor) {
    			insert(target, div, anchor);

    			for (var i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(div, null);
    			}
    		},

    		p: function update(changed, ctx) {
    			if (changed.items) {
    				each_value = ctx.items;

    				for (var i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context$7(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(changed, child_ctx);
    					} else {
    						each_blocks[i] = create_each_block$7(child_ctx);
    						each_blocks[i].c();
    						each_blocks[i].m(div, null);
    					}
    				}

    				for (; i < each_blocks.length; i += 1) {
    					each_blocks[i].d(1);
    				}
    				each_blocks.length = each_value.length;
    			}

    			if (changed.y) {
    				set_style(div, "top", "" + ctx.y + "px");
    			}

    			if (changed.x) {
    				set_style(div, "left", "" + ctx.x + "px");
    			}

    			if (changed.show) {
    				toggle_class(div, "show", ctx.show);
    			}
    		},

    		i: noop,
    		o: noop,

    		d: function destroy(detaching) {
    			if (detaching) {
    				detach(div);
    			}

    			destroy_each(each_blocks, detaching);
    		}
    	};
    }

    function instance$c($$self, $$props, $$invalidate) {
    	let { show = false, items = [], x = 0, y = 0 } = $$props;
    	onMount(() => document.getElementsByTagName('button')[0].focus());
    	if (x <= 20) {
    		$$invalidate('x', x = 20);
    	}

    	const writable_props = ['show', 'items', 'x', 'y'];
    	Object.keys($$props).forEach(key => {
    		if (!writable_props.includes(key) && !key.startsWith('$$')) console.warn(`<Menu> was created with unknown prop '${key}'`);
    	});

    	$$self.$set = $$props => {
    		if ('show' in $$props) $$invalidate('show', show = $$props.show);
    		if ('items' in $$props) $$invalidate('items', items = $$props.items);
    		if ('x' in $$props) $$invalidate('x', x = $$props.x);
    		if ('y' in $$props) $$invalidate('y', y = $$props.y);
    	};

    	return { show, items, x, y };
    }

    class Menu extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$c, create_fragment$c, safe_not_equal, ["show", "items", "x", "y"]);
    	}

    	get show() {
    		throw new Error("<Menu>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set show(value) {
    		throw new Error("<Menu>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get items() {
    		throw new Error("<Menu>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set items(value) {
    		throw new Error("<Menu>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get x() {
    		throw new Error("<Menu>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set x(value) {
    		throw new Error("<Menu>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get y() {
    		throw new Error("<Menu>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set y(value) {
    		throw new Error("<Menu>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* client/src/App.svelte generated by Svelte v3.8.0 */
    const { Error: Error_1 } = globals;

    const file$d = "client/src/App.svelte";

    function get_each_context$8(ctx, list, i) {
    	const child_ctx = Object.create(ctx);
    	child_ctx.msg = list[i];
    	child_ctx.idx = i;
    	return child_ctx;
    }

    function get_each_context_1$1(ctx, list, i) {
    	const child_ctx = Object.create(ctx);
    	child_ctx.theJob = list[i];
    	child_ctx.i = i;
    	return child_ctx;
    }

    function get_each_context_2(ctx, list, i) {
    	const child_ctx = Object.create(ctx);
    	child_ctx.theType = list[i];
    	return child_ctx;
    }

    // (408:0) {:catch error}
    function create_catch_block(ctx) {
    	var p, t_value = ctx.error.message + "", t;

    	return {
    		c: function create() {
    			p = element("p");
    			t = text(t_value);
    			set_style(p, "color", "red");
    			add_location(p, file$d, 408, 1, 10440);
    		},

    		m: function mount(target, anchor) {
    			insert(target, p, anchor);
    			append(p, t);
    		},

    		p: function update(changed, ctx) {
    			if ((changed.promise) && t_value !== (t_value = ctx.error.message + "")) {
    				set_data(t, t_value);
    			}
    		},

    		i: noop,
    		o: noop,

    		d: function destroy(detaching) {
    			if (detaching) {
    				detach(p);
    			}
    		}
    	};
    }

    // (292:0) {:then data}
    function create_then_block(ctx) {
    	var table, tr, th0, input0, t0, th1, img0, t1, img1, t2, th2, select, t3, th3, img2, t4, img3, t5, img4, t6, th4, ol, li0, t8, li1, t10, li2, t12, th5, label0, input1, t13, t14, br, label1, input2, t15, t16, t17, col0, t18, col1, t19, col2, t20, col3, t21, col4, t22, col5, t23, p, t24, t25_value = ctx.$jobs.length + "", t25, t26, t27_value = ctx.$jobs.filter(func).length + "", t27, t28, t29_value = ctx.$jobs.filter(func_1).length + "", t29, t30, t31, t32, if_block2_anchor, current, dispose;

    	var each_value_2 = ctx.types;

    	var each_blocks_1 = [];

    	for (var i = 0; i < each_value_2.length; i += 1) {
    		each_blocks_1[i] = create_each_block_2(get_each_context_2(ctx, each_value_2, i));
    	}

    	var each_value_1 = ctx.$jobs;

    	var each_blocks = [];

    	for (var i = 0; i < each_value_1.length; i += 1) {
    		each_blocks[i] = create_each_block_1$1(get_each_context_1$1(ctx, each_value_1, i));
    	}

    	const out = i => transition_out(each_blocks[i], 1, 1, () => {
    		each_blocks[i] = null;
    	});

    	var if_block0 = (ctx.smsEditorType) && create_if_block_2$2(ctx);

    	var if_block1 = (ctx.showDriverEditor) && create_if_block_1$3(ctx);

    	var if_block2 = (ctx.showStateEditor) && create_if_block$5(ctx);

    	return {
    		c: function create() {
    			table = element("table");
    			tr = element("tr");
    			th0 = element("th");
    			input0 = element("input");
    			t0 = space();
    			th1 = element("th");
    			img0 = element("img");
    			t1 = space();
    			img1 = element("img");
    			t2 = space();
    			th2 = element("th");
    			select = element("select");

    			for (var i = 0; i < each_blocks_1.length; i += 1) {
    				each_blocks_1[i].c();
    			}

    			t3 = space();
    			th3 = element("th");
    			img2 = element("img");
    			t4 = space();
    			img3 = element("img");
    			t5 = space();
    			img4 = element("img");
    			t6 = space();
    			th4 = element("th");
    			ol = element("ol");
    			li0 = element("li");
    			li0.textContent = "Ti";
    			t8 = space();
    			li1 = element("li");
    			li1.textContent = "On";
    			t10 = space();
    			li2 = element("li");
    			li2.textContent = "To";
    			t12 = space();
    			th5 = element("th");
    			label0 = element("label");
    			input1 = element("input");
    			t13 = text("Bare valgte dager");
    			t14 = space();
    			br = element("br");
    			label1 = element("label");
    			input2 = element("input");
    			t15 = text("Skjul hentede");
    			t16 = space();

    			for (var i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			t17 = space();
    			col0 = element("col");
    			t18 = space();
    			col1 = element("col");
    			t19 = space();
    			col2 = element("col");
    			t20 = space();
    			col3 = element("col");
    			t21 = space();
    			col4 = element("col");
    			t22 = space();
    			col5 = element("col");
    			t23 = space();
    			p = element("p");
    			t24 = text("Antall jobber totalt: ");
    			t25 = text(t25_value);
    			t26 = text(". \n\tHentes nå: ");
    			t27 = text(t27_value);
    			t28 = text("\n\tHentet: ");
    			t29 = text(t29_value);
    			t30 = space();
    			if (if_block0) if_block0.c();
    			t31 = space();
    			if (if_block1) if_block1.c();
    			t32 = space();
    			if (if_block2) if_block2.c();
    			if_block2_anchor = empty();
    			attr(input0, "type", "search");
    			attr(input0, "placeholder", "Filtrer");
    			add_location(input0, file$d, 294, 7, 7203);
    			add_location(th0, file$d, 294, 3, 7199);
    			attr(img0, "src", "/images/bigcar.png");
    			attr(img0, "alt", "stor bil");
    			attr(img0, "height", "22");
    			attr(img0, "tabindex", "0");
    			toggle_class(img0, "bigActive", ctx.bigActive);
    			add_location(img0, file$d, 296, 4, 7292);
    			attr(img1, "src", "/images/smallcar.png");
    			attr(img1, "alt", "liten bil");
    			attr(img1, "height", "22");
    			attr(img1, "tabindex", "0");
    			toggle_class(img1, "smallActive", ctx.smallActive);
    			add_location(img1, file$d, 300, 4, 7442);
    			add_location(th1, file$d, 295, 3, 7283);
    			if (ctx.typeFilter === void 0) add_render_callback(() => ctx.select_change_handler.call(select));
    			add_location(select, file$d, 306, 4, 7621);
    			add_location(th2, file$d, 305, 3, 7612);
    			attr(img2, "src", "/images/star-full.png");
    			attr(img2, "width", "16");
    			attr(img2, "alt", "antatt kvalitet");
    			add_location(img2, file$d, 313, 4, 7765);
    			attr(img3, "src", "/images/star-full.png");
    			attr(img3, "width", "16");
    			attr(img3, "alt", "");
    			add_location(img3, file$d, 314, 4, 7836);
    			attr(img4, "src", "/images/star-full.png");
    			attr(img4, "width", "16");
    			attr(img4, "alt", "");
    			add_location(img4, file$d, 315, 4, 7892);
    			add_location(th3, file$d, 312, 3, 7756);
    			attr(li0, "tabindex", "0");
    			toggle_class(li0, "tueActive", ctx.tueActive);
    			add_location(li0, file$d, 320, 5, 8069);
    			attr(li1, "tabindex", "0");
    			toggle_class(li1, "wedActive", ctx.wedActive);
    			add_location(li1, file$d, 321, 5, 8156);
    			attr(li2, "tabindex", "0");
    			toggle_class(li2, "thuActive", ctx.thuActive);
    			add_location(li2, file$d, 322, 5, 8243);
    			attr(ol, "class", "days");
    			add_location(ol, file$d, 318, 4, 7965);
    			add_location(th4, file$d, 317, 3, 7956);
    			attr(input1, "type", "checkbox");
    			add_location(input1, file$d, 326, 11, 8363);
    			add_location(label0, file$d, 326, 4, 8356);
    			add_location(br, file$d, 327, 4, 8450);
    			attr(input2, "type", "checkbox");
    			add_location(input2, file$d, 327, 15, 8461);
    			add_location(label1, file$d, 327, 8, 8454);
    			add_location(th5, file$d, 325, 3, 8347);
    			add_location(tr, file$d, 293, 2, 7191);
    			attr(col0, "class", "address");
    			add_location(col0, file$d, 341, 1, 8905);
    			attr(col1, "class", "cartype");
    			add_location(col1, file$d, 342, 1, 8930);
    			attr(col2, "class", "stufftype");
    			add_location(col2, file$d, 343, 1, 8955);
    			attr(col3, "class", "quality");
    			add_location(col3, file$d, 344, 1, 8982);
    			attr(col4, "class", "dayscol");
    			add_location(col4, file$d, 345, 1, 9007);
    			attr(col5, "class", "status");
    			add_location(col5, file$d, 346, 1, 9032);
    			attr(table, "class", "main");
    			add_location(table, file$d, 292, 1, 7168);
    			add_location(p, file$d, 349, 0, 9065);

    			dispose = [
    				listen(input0, "input", ctx.input0_input_handler),
    				listen(img0, "click", ctx.click_handler_1),
    				listen(img1, "click", ctx.click_handler_2),
    				listen(select, "change", ctx.select_change_handler),
    				listen(li0, "click", ctx.click_handler_3),
    				listen(li1, "click", ctx.click_handler_4),
    				listen(li2, "click", ctx.click_handler_5),
    				listen(input1, "change", ctx.input1_change_handler),
    				listen(input2, "change", ctx.input2_change_handler)
    			];
    		},

    		m: function mount(target, anchor) {
    			insert(target, table, anchor);
    			append(table, tr);
    			append(tr, th0);
    			append(th0, input0);

    			input0.value = ctx.freeTextFilter;

    			append(tr, t0);
    			append(tr, th1);
    			append(th1, img0);
    			append(th1, t1);
    			append(th1, img1);
    			append(tr, t2);
    			append(tr, th2);
    			append(th2, select);

    			for (var i = 0; i < each_blocks_1.length; i += 1) {
    				each_blocks_1[i].m(select, null);
    			}

    			select_option(select, ctx.typeFilter);

    			append(tr, t3);
    			append(tr, th3);
    			append(th3, img2);
    			append(th3, t4);
    			append(th3, img3);
    			append(th3, t5);
    			append(th3, img4);
    			append(tr, t6);
    			append(tr, th4);
    			append(th4, ol);
    			append(ol, li0);
    			append(ol, t8);
    			append(ol, li1);
    			append(ol, t10);
    			append(ol, li2);
    			append(tr, t12);
    			append(tr, th5);
    			append(th5, label0);
    			append(label0, input1);

    			input1.checked = ctx.dayFilterExclusive;

    			append(label0, t13);
    			append(th5, t14);
    			append(th5, br);
    			append(th5, label1);
    			append(label1, input2);

    			input2.checked = ctx.hideDoneJobs;

    			append(label1, t15);
    			append(table, t16);

    			for (var i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(table, null);
    			}

    			append(table, t17);
    			append(table, col0);
    			append(table, t18);
    			append(table, col1);
    			append(table, t19);
    			append(table, col2);
    			append(table, t20);
    			append(table, col3);
    			append(table, t21);
    			append(table, col4);
    			append(table, t22);
    			append(table, col5);
    			insert(target, t23, anchor);
    			insert(target, p, anchor);
    			append(p, t24);
    			append(p, t25);
    			append(p, t26);
    			append(p, t27);
    			append(p, t28);
    			append(p, t29);
    			insert(target, t30, anchor);
    			if (if_block0) if_block0.m(target, anchor);
    			insert(target, t31, anchor);
    			if (if_block1) if_block1.m(target, anchor);
    			insert(target, t32, anchor);
    			if (if_block2) if_block2.m(target, anchor);
    			insert(target, if_block2_anchor, anchor);
    			current = true;
    		},

    		p: function update(changed, ctx) {
    			if (changed.freeTextFilter) input0.value = ctx.freeTextFilter;

    			if (changed.bigActive) {
    				toggle_class(img0, "bigActive", ctx.bigActive);
    			}

    			if (changed.smallActive) {
    				toggle_class(img1, "smallActive", ctx.smallActive);
    			}

    			if (changed.types) {
    				each_value_2 = ctx.types;

    				for (var i = 0; i < each_value_2.length; i += 1) {
    					const child_ctx = get_each_context_2(ctx, each_value_2, i);

    					if (each_blocks_1[i]) {
    						each_blocks_1[i].p(changed, child_ctx);
    					} else {
    						each_blocks_1[i] = create_each_block_2(child_ctx);
    						each_blocks_1[i].c();
    						each_blocks_1[i].m(select, null);
    					}
    				}

    				for (; i < each_blocks_1.length; i += 1) {
    					each_blocks_1[i].d(1);
    				}
    				each_blocks_1.length = each_value_2.length;
    			}

    			if (changed.typeFilter) select_option(select, ctx.typeFilter);

    			if (changed.tueActive) {
    				toggle_class(li0, "tueActive", ctx.tueActive);
    			}

    			if (changed.wedActive) {
    				toggle_class(li1, "wedActive", ctx.wedActive);
    			}

    			if (changed.thuActive) {
    				toggle_class(li2, "thuActive", ctx.thuActive);
    			}

    			if (changed.dayFilterExclusive) input1.checked = ctx.dayFilterExclusive;
    			if (changed.hideDoneJobs) input2.checked = ctx.hideDoneJobs;

    			if (changed.filter || changed.freeTextFilter || changed.smallActive || changed.bigActive || changed.monActive || changed.tueActive || changed.wedActive || changed.thuActive || changed.dayFilterExclusive || changed.typeFilter || changed.hideDoneJobs || changed.$jobs || changed.selectedItems) {
    				each_value_1 = ctx.$jobs;

    				for (var i = 0; i < each_value_1.length; i += 1) {
    					const child_ctx = get_each_context_1$1(ctx, each_value_1, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(changed, child_ctx);
    						transition_in(each_blocks[i], 1);
    					} else {
    						each_blocks[i] = create_each_block_1$1(child_ctx);
    						each_blocks[i].c();
    						transition_in(each_blocks[i], 1);
    						each_blocks[i].m(table, t17);
    					}
    				}

    				group_outros();
    				for (i = each_value_1.length; i < each_blocks.length; i += 1) out(i);
    				check_outros();
    			}

    			if ((!current || changed.$jobs) && t25_value !== (t25_value = ctx.$jobs.length + "")) {
    				set_data(t25, t25_value);
    			}

    			if ((!current || changed.$jobs) && t27_value !== (t27_value = ctx.$jobs.filter(func).length + "")) {
    				set_data(t27, t27_value);
    			}

    			if ((!current || changed.$jobs) && t29_value !== (t29_value = ctx.$jobs.filter(func_1).length + "")) {
    				set_data(t29, t29_value);
    			}

    			if (ctx.smsEditorType) {
    				if (if_block0) {
    					if_block0.p(changed, ctx);
    					transition_in(if_block0, 1);
    				} else {
    					if_block0 = create_if_block_2$2(ctx);
    					if_block0.c();
    					transition_in(if_block0, 1);
    					if_block0.m(t31.parentNode, t31);
    				}
    			} else if (if_block0) {
    				group_outros();
    				transition_out(if_block0, 1, 1, () => {
    					if_block0 = null;
    				});
    				check_outros();
    			}

    			if (ctx.showDriverEditor) {
    				if (!if_block1) {
    					if_block1 = create_if_block_1$3(ctx);
    					if_block1.c();
    					transition_in(if_block1, 1);
    					if_block1.m(t32.parentNode, t32);
    				} else {
    									transition_in(if_block1, 1);
    				}
    			} else if (if_block1) {
    				group_outros();
    				transition_out(if_block1, 1, 1, () => {
    					if_block1 = null;
    				});
    				check_outros();
    			}

    			if (ctx.showStateEditor) {
    				if (!if_block2) {
    					if_block2 = create_if_block$5(ctx);
    					if_block2.c();
    					transition_in(if_block2, 1);
    					if_block2.m(if_block2_anchor.parentNode, if_block2_anchor);
    				} else {
    									transition_in(if_block2, 1);
    				}
    			} else if (if_block2) {
    				group_outros();
    				transition_out(if_block2, 1, 1, () => {
    					if_block2 = null;
    				});
    				check_outros();
    			}
    		},

    		i: function intro(local) {
    			if (current) return;
    			for (var i = 0; i < each_value_1.length; i += 1) transition_in(each_blocks[i]);

    			transition_in(if_block0);
    			transition_in(if_block1);
    			transition_in(if_block2);
    			current = true;
    		},

    		o: function outro(local) {
    			each_blocks = each_blocks.filter(Boolean);
    			for (let i = 0; i < each_blocks.length; i += 1) transition_out(each_blocks[i]);

    			transition_out(if_block0);
    			transition_out(if_block1);
    			transition_out(if_block2);
    			current = false;
    		},

    		d: function destroy(detaching) {
    			if (detaching) {
    				detach(table);
    			}

    			destroy_each(each_blocks_1, detaching);

    			destroy_each(each_blocks, detaching);

    			if (detaching) {
    				detach(t23);
    				detach(p);
    				detach(t30);
    			}

    			if (if_block0) if_block0.d(detaching);

    			if (detaching) {
    				detach(t31);
    			}

    			if (if_block1) if_block1.d(detaching);

    			if (detaching) {
    				detach(t32);
    			}

    			if (if_block2) if_block2.d(detaching);

    			if (detaching) {
    				detach(if_block2_anchor);
    			}

    			run_all(dispose);
    		}
    	};
    }

    // (308:5) {#each types as theType}
    function create_each_block_2(ctx) {
    	var option, t_value = ctx.theType + "", t, option_value_value;

    	return {
    		c: function create() {
    			option = element("option");
    			t = text(t_value);
    			option.__value = option_value_value = ctx.theType;
    			option.value = option.__value;
    			add_location(option, file$d, 308, 6, 7690);
    		},

    		m: function mount(target, anchor) {
    			insert(target, option, anchor);
    			append(option, t);
    		},

    		p: function update(changed, ctx) {
    			option.value = option.__value;
    		},

    		d: function destroy(detaching) {
    			if (detaching) {
    				detach(option);
    			}
    		}
    	};
    }

    // (332:2) {#if filter(freeTextFilter, {smallActive, bigActive},     {monActive, tueActive, wedActive, thuActive, dayFilterExclusive}, typeFilter, hideDoneJobs, theJob)   }
    function create_if_block_3$1(ctx) {
    	var current;

    	var renderjob = new RenderJob({
    		props: {
    		itemData: ctx.theJob,
    		itemSelected: ctx.selectedItems.indexOf(ctx.theJob.id) > -1
    	},
    		$$inline: true
    	});
    	renderjob.$on("select", ctx.select_handler);

    	return {
    		c: function create() {
    			renderjob.$$.fragment.c();
    		},

    		m: function mount(target, anchor) {
    			mount_component(renderjob, target, anchor);
    			current = true;
    		},

    		p: function update(changed, ctx) {
    			var renderjob_changes = {};
    			if (changed.$jobs) renderjob_changes.itemData = ctx.theJob;
    			if (changed.selectedItems || changed.$jobs) renderjob_changes.itemSelected = ctx.selectedItems.indexOf(ctx.theJob.id) > -1;
    			renderjob.$set(renderjob_changes);
    		},

    		i: function intro(local) {
    			if (current) return;
    			transition_in(renderjob.$$.fragment, local);

    			current = true;
    		},

    		o: function outro(local) {
    			transition_out(renderjob.$$.fragment, local);
    			current = false;
    		},

    		d: function destroy(detaching) {
    			destroy_component(renderjob, detaching);
    		}
    	};
    }

    // (331:1) {#each $jobs as theJob, i}
    function create_each_block_1$1(ctx) {
    	var if_block_anchor, current;

    	var if_block = (filter(ctx.freeTextFilter, {smallActive: ctx.smallActive, bigActive: ctx.bigActive}, 
    			{monActive, tueActive: ctx.tueActive, wedActive: ctx.wedActive, thuActive: ctx.thuActive, dayFilterExclusive: ctx.dayFilterExclusive}, ctx.typeFilter, ctx.hideDoneJobs, ctx.theJob)) && create_if_block_3$1(ctx);

    	return {
    		c: function create() {
    			if (if_block) if_block.c();
    			if_block_anchor = empty();
    		},

    		m: function mount(target, anchor) {
    			if (if_block) if_block.m(target, anchor);
    			insert(target, if_block_anchor, anchor);
    			current = true;
    		},

    		p: function update(changed, ctx) {
    			if (filter(ctx.freeTextFilter, {smallActive: ctx.smallActive, bigActive: ctx.bigActive}, 
    			{monActive, tueActive: ctx.tueActive, wedActive: ctx.wedActive, thuActive: ctx.thuActive, dayFilterExclusive: ctx.dayFilterExclusive}, ctx.typeFilter, ctx.hideDoneJobs, ctx.theJob)) {
    				if (if_block) {
    					if_block.p(changed, ctx);
    					transition_in(if_block, 1);
    				} else {
    					if_block = create_if_block_3$1(ctx);
    					if_block.c();
    					transition_in(if_block, 1);
    					if_block.m(if_block_anchor.parentNode, if_block_anchor);
    				}
    			} else if (if_block) {
    				group_outros();
    				transition_out(if_block, 1, 1, () => {
    					if_block = null;
    				});
    				check_outros();
    			}
    		},

    		i: function intro(local) {
    			if (current) return;
    			transition_in(if_block);
    			current = true;
    		},

    		o: function outro(local) {
    			transition_out(if_block);
    			current = false;
    		},

    		d: function destroy(detaching) {
    			if (if_block) if_block.d(detaching);

    			if (detaching) {
    				detach(if_block_anchor);
    			}
    		}
    	};
    }

    // (356:0) {#if smsEditorType}
    function create_if_block_2$2(ctx) {
    	var current;

    	var modal = new Modal({
    		props: {
    		$$slots: {
    		default: [create_default_slot_2],
    		header: [create_header_slot_2]
    	},
    		$$scope: { ctx }
    	},
    		$$inline: true
    	});
    	modal.$on("close", ctx.close_handler);

    	return {
    		c: function create() {
    			modal.$$.fragment.c();
    		},

    		m: function mount(target, anchor) {
    			mount_component(modal, target, anchor);
    			current = true;
    		},

    		p: function update(changed, ctx) {
    			var modal_changes = {};
    			if (changed.$$scope || changed.possibleRecipients || changed.recipients || changed.message) modal_changes.$$scope = { changed, ctx };
    			modal.$set(modal_changes);
    		},

    		i: function intro(local) {
    			if (current) return;
    			transition_in(modal.$$.fragment, local);

    			current = true;
    		},

    		o: function outro(local) {
    			transition_out(modal.$$.fragment, local);
    			current = false;
    		},

    		d: function destroy(detaching) {
    			destroy_component(modal, detaching);
    		}
    	};
    }

    // (358:2) <h2 slot="header">
    function create_header_slot_2(ctx) {
    	var h2;

    	return {
    		c: function create() {
    			h2 = element("h2");
    			h2.textContent = "Send SMS";
    			attr(h2, "slot", "header");
    			add_location(h2, file$d, 357, 2, 9317);
    		},

    		m: function mount(target, anchor) {
    			insert(target, h2, anchor);
    		},

    		d: function destroy(detaching) {
    			if (detaching) {
    				detach(h2);
    			}
    		}
    	};
    }

    // (357:1) <Modal on:close="{() => smsEditorType = ''}">
    function create_default_slot_2(ctx) {
    	var t, current;

    	var smseditor = new SMSEditor({
    		props: {
    		possibleRecipients: ctx.possibleRecipients,
    		recipients: ctx.recipients,
    		message: ctx.message
    	},
    		$$inline: true
    	});
    	smseditor.$on("cancel", ctx.cancel_handler);
    	smseditor.$on("sms", ctx.sms_handler);

    	return {
    		c: function create() {
    			t = space();
    			smseditor.$$.fragment.c();
    		},

    		m: function mount(target, anchor) {
    			insert(target, t, anchor);
    			mount_component(smseditor, target, anchor);
    			current = true;
    		},

    		p: function update(changed, ctx) {
    			var smseditor_changes = {};
    			if (changed.possibleRecipients) smseditor_changes.possibleRecipients = ctx.possibleRecipients;
    			if (changed.recipients) smseditor_changes.recipients = ctx.recipients;
    			if (changed.message) smseditor_changes.message = ctx.message;
    			smseditor.$set(smseditor_changes);
    		},

    		i: function intro(local) {
    			if (current) return;
    			transition_in(smseditor.$$.fragment, local);

    			current = true;
    		},

    		o: function outro(local) {
    			transition_out(smseditor.$$.fragment, local);
    			current = false;
    		},

    		d: function destroy(detaching) {
    			if (detaching) {
    				detach(t);
    			}

    			destroy_component(smseditor, detaching);
    		}
    	};
    }

    // (379:0) {#if showDriverEditor}
    function create_if_block_1$3(ctx) {
    	var current;

    	var modal = new Modal({
    		props: {
    		$$slots: {
    		default: [create_default_slot_1],
    		header: [create_header_slot_1]
    	},
    		$$scope: { ctx }
    	},
    		$$inline: true
    	});
    	modal.$on("close", ctx.close_handler_1);

    	return {
    		c: function create() {
    			modal.$$.fragment.c();
    		},

    		m: function mount(target, anchor) {
    			mount_component(modal, target, anchor);
    			current = true;
    		},

    		i: function intro(local) {
    			if (current) return;
    			transition_in(modal.$$.fragment, local);

    			current = true;
    		},

    		o: function outro(local) {
    			transition_out(modal.$$.fragment, local);
    			current = false;
    		},

    		d: function destroy(detaching) {
    			destroy_component(modal, detaching);
    		}
    	};
    }

    // (381:2) <h2 slot="header">
    function create_header_slot_1(ctx) {
    	var h2;

    	return {
    		c: function create() {
    			h2 = element("h2");
    			h2.textContent = "Oppdater hentere";
    			attr(h2, "slot", "header");
    			add_location(h2, file$d, 380, 2, 9878);
    		},

    		m: function mount(target, anchor) {
    			insert(target, h2, anchor);
    		},

    		d: function destroy(detaching) {
    			if (detaching) {
    				detach(h2);
    			}
    		}
    	};
    }

    // (380:1) <Modal on:close="{() => showDriverEditor = false}">
    function create_default_slot_1(ctx) {
    	var t, current;

    	var drivereditor = new DriverEditor({ $$inline: true });
    	drivereditor.$on("cancel", ctx.cancel_handler_1);

    	return {
    		c: function create() {
    			t = space();
    			drivereditor.$$.fragment.c();
    		},

    		m: function mount(target, anchor) {
    			insert(target, t, anchor);
    			mount_component(drivereditor, target, anchor);
    			current = true;
    		},

    		p: noop,

    		i: function intro(local) {
    			if (current) return;
    			transition_in(drivereditor.$$.fragment, local);

    			current = true;
    		},

    		o: function outro(local) {
    			transition_out(drivereditor.$$.fragment, local);
    			current = false;
    		},

    		d: function destroy(detaching) {
    			if (detaching) {
    				detach(t);
    			}

    			destroy_component(drivereditor, detaching);
    		}
    	};
    }

    // (389:0) {#if showStateEditor}
    function create_if_block$5(ctx) {
    	var current;

    	var modal = new Modal({
    		props: {
    		$$slots: {
    		default: [create_default_slot$1],
    		header: [create_header_slot$1]
    	},
    		$$scope: { ctx }
    	},
    		$$inline: true
    	});
    	modal.$on("close", ctx.close_handler_2);

    	return {
    		c: function create() {
    			modal.$$.fragment.c();
    		},

    		m: function mount(target, anchor) {
    			mount_component(modal, target, anchor);
    			current = true;
    		},

    		i: function intro(local) {
    			if (current) return;
    			transition_in(modal.$$.fragment, local);

    			current = true;
    		},

    		o: function outro(local) {
    			transition_out(modal.$$.fragment, local);
    			current = false;
    		},

    		d: function destroy(detaching) {
    			destroy_component(modal, detaching);
    		}
    	};
    }

    // (391:2) <h2 slot="header">
    function create_header_slot$1(ctx) {
    	var h2;

    	return {
    		c: function create() {
    			h2 = element("h2");
    			h2.textContent = "Oppdater status";
    			attr(h2, "slot", "header");
    			add_location(h2, file$d, 390, 2, 10089);
    		},

    		m: function mount(target, anchor) {
    			insert(target, h2, anchor);
    		},

    		d: function destroy(detaching) {
    			if (detaching) {
    				detach(h2);
    			}
    		}
    	};
    }

    // (390:1) <Modal on:close="{() => showStateEditor = false}">
    function create_default_slot$1(ctx) {
    	var t, current;

    	var stateeditor = new StateEditor({ $$inline: true });
    	stateeditor.$on("cancel", ctx.cancel_handler_2);
    	stateeditor.$on("statusupdate", ctx.statusupdate_handler);

    	return {
    		c: function create() {
    			t = space();
    			stateeditor.$$.fragment.c();
    		},

    		m: function mount(target, anchor) {
    			insert(target, t, anchor);
    			mount_component(stateeditor, target, anchor);
    			current = true;
    		},

    		p: noop,

    		i: function intro(local) {
    			if (current) return;
    			transition_in(stateeditor.$$.fragment, local);

    			current = true;
    		},

    		o: function outro(local) {
    			transition_out(stateeditor.$$.fragment, local);
    			current = false;
    		},

    		d: function destroy(detaching) {
    			if (detaching) {
    				detach(t);
    			}

    			destroy_component(stateeditor, detaching);
    		}
    	};
    }

    // (289:16)   <div class="loading"><LoadingIcon /></div>  <p style="text-align: center;">...henter data</p> {:then data}
    function create_pending_block(ctx) {
    	var div, t, p, current;

    	var loadingicon = new LoadingIcon({ $$inline: true });

    	return {
    		c: function create() {
    			div = element("div");
    			loadingicon.$$.fragment.c();
    			t = space();
    			p = element("p");
    			p.textContent = "...henter data";
    			attr(div, "class", "loading");
    			add_location(div, file$d, 289, 1, 7060);
    			set_style(p, "text-align", "center");
    			add_location(p, file$d, 290, 1, 7104);
    		},

    		m: function mount(target, anchor) {
    			insert(target, div, anchor);
    			mount_component(loadingicon, div, null);
    			insert(target, t, anchor);
    			insert(target, p, anchor);
    			current = true;
    		},

    		p: noop,

    		i: function intro(local) {
    			if (current) return;
    			transition_in(loadingicon.$$.fragment, local);

    			current = true;
    		},

    		o: function outro(local) {
    			transition_out(loadingicon.$$.fragment, local);
    			current = false;
    		},

    		d: function destroy(detaching) {
    			if (detaching) {
    				detach(div);
    			}

    			destroy_component(loadingicon);

    			if (detaching) {
    				detach(t);
    				detach(p);
    			}
    		}
    	};
    }

    // (454:0) {#each tempMsgQueue as msg, idx}
    function create_each_block$8(ctx) {
    	var current;

    	var flashmessage_spread_levels = [
    		ctx.msg,
    		{ index: ctx.idx }
    	];

    	let flashmessage_props = {};
    	for (var i = 0; i < flashmessage_spread_levels.length; i += 1) {
    		flashmessage_props = assign(flashmessage_props, flashmessage_spread_levels[i]);
    	}
    	var flashmessage = new FlashMessage({
    		props: flashmessage_props,
    		$$inline: true
    	});

    	return {
    		c: function create() {
    			flashmessage.$$.fragment.c();
    		},

    		m: function mount(target, anchor) {
    			mount_component(flashmessage, target, anchor);
    			current = true;
    		},

    		p: function update(changed, ctx) {
    			var flashmessage_changes = (changed.tempMsgQueue) ? get_spread_update(flashmessage_spread_levels, [
    									ctx.msg,
    			flashmessage_spread_levels[1]
    								]) : {};
    			flashmessage.$set(flashmessage_changes);
    		},

    		i: function intro(local) {
    			if (current) return;
    			transition_in(flashmessage.$$.fragment, local);

    			current = true;
    		},

    		o: function outro(local) {
    			transition_out(flashmessage.$$.fragment, local);
    			current = false;
    		},

    		d: function destroy(detaching) {
    			destroy_component(flashmessage, detaching);
    		}
    	};
    }

    function create_fragment$d(ctx) {
    	var div, button, img, t0, h1, t2, style, t4, promise_1, t5, t6, t7, current, dispose;

    	let info = {
    		ctx,
    		current: null,
    		token: null,
    		pending: create_pending_block,
    		then: create_then_block,
    		catch: create_catch_block,
    		value: 'data',
    		error: 'error',
    		blocks: [,,,]
    	};

    	handle_promise(promise_1 = ctx.promise, info);

    	var menu0 = new Menu({
    		props: {
    		show: ctx.showMenu,
    		x: ctx.menuX,
    		y: ctx.menuY,
    		items: [
    		{
    			label: 'SMS til giver', icon: '/images/sms.png',
    			action: ctx.func_2
    		},
    		{
    			label: 'SMS til henter', icon: '/images/sms.png',
    			action: ctx.func_3
    		},
    		{
    			label: 'Sett status', icon: '/images/wrench.png',
    			action: ctx.func_4
    		},
    	]
    	},
    		$$inline: true
    	});

    	var menu1 = new Menu({
    		props: {
    		show: ctx.showConfigMenu,
    		x: ctx.menuX,
    		y: ctx.menuY,
    		items: [
    		{
    			label: 'Hentere', icon: '/images/smallcar.png',
    			action: ctx.func_5
    		},
    		{
    			label: 'Oppdater data', icon: '/images/wrench.png',
    			action: ctx.func_6
    		},
    		{
    			label: 'Merk alle', icon: '/images/check.png',
    			action: ctx.func_7
    		},
    		{
    			label: 'Fjern merking', icon: '/images/nocheck.png',
    			action: ctx.func_8
    		},
    	]
    	},
    		$$inline: true
    	});

    	var each_value = ctx.tempMsgQueue;

    	var each_blocks = [];

    	for (var i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block$8(get_each_context$8(ctx, each_value, i));
    	}

    	const out = i => transition_out(each_blocks[i], 1, 1, () => {
    		each_blocks[i] = null;
    	});

    	return {
    		c: function create() {
    			div = element("div");
    			button = element("button");
    			img = element("img");
    			t0 = space();
    			h1 = element("h1");
    			h1.textContent = "Loppisadmin";
    			t2 = space();
    			style = element("style");
    			style.textContent = "h1 {text-align: center;}\n\t.conf {float: right; padding: 4px;margin-right: 8em}\n\t.conf img {vertical-align: middle;}\n\ttable.main {\n\t\twidth: 80%;\n\t\tmargin-left: 10%;\n\t\tmargin-right: 10%;\n\t\tborder-collapse: collapse;\n\t\tborder: 1px solid grey;\n\t}\n\ttable.main tr:first-child {\n\t\tbackground: #eee;\n\t\tborder-bottom: 1px solid black;\n\t}\n\tth {text-align: left; padding-left: 16px; }\n\tth li {\n\t\tdisplay: inline-block;\n\t\theight: 20px;\n\t\twidth: 20px;\n\t\tborder-bottom: 1px solid grey;\n\t\tcolor: grey;\n\t\tfont-weight: lighter;\n\t\tmargin-left: 8px;\n\t\tcursor: pointer;\n\t}\n\t.smallActive, .bigActive {\n\t\tborder: 1px solid black;\n\t}\n\t.smallActive, .bigActive, li.monActive, li.tueActive, li.wedActive, li.thuActive {\n\t\tborder-color: black;\n\t\tcolor: black;\n\t}\n\tlabel {font-weight: lighter; font-style: italic;}\n\n\n/* Extra small devices (phones, 600px and down) */\n@media only screen and (max-width: 600px) {\n\tth:nth-child(3) {display: none;}\n\tth:nth-child(4) {display: none;}\n\tth:nth-child(5) {display: none;}\n\ttable {width: 99%; margin: 0;}\n} \n\n@media only screen and (max-width: 700px) {\n\tth:nth-child(3) {display: none;}\n\t.stufftype {width: 25%}\n\t.dayscol {width: 25%}\n\ttable {width: 95%; margin: 2.5%;}\n}\n/* column styles */\n.address {\n\tbackground: #eee;\n\twidth: 25%;\n}\n.cartype {\n\twidth: 5%;\n}\n.quality {\n\twidth: 10%;\n}\n.stufftype {\n\twidth: 10%;\n}\n.dayscol {\n\twidth: 20%;\n}\n.status {\n\twidth: 15%;\n}\n.loading {\n\tposition: fixed;\n\tleft: 45%;\n\tright: 50%;\n\ttop: 45%;\n\tbottom: 50%;\n}";
    			t4 = space();

    			info.block.c();

    			t5 = space();
    			menu0.$$.fragment.c();
    			t6 = space();
    			menu1.$$.fragment.c();
    			t7 = space();

    			for (var i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}
    			attr(img, "src", "/images/wrench.png");
    			attr(img, "width", "24");
    			attr(img, "alt", "Innstillinger");
    			add_location(img, file$d, 203, 1, 5449);
    			attr(button, "class", "conf");
    			add_location(button, file$d, 202, 0, 5367);
    			add_location(h1, file$d, 206, 0, 5522);
    			attr(style, "type", "text/css");
    			add_location(style, file$d, 208, 0, 5544);
    			add_location(div, file$d, 193, 0, 5179);

    			dispose = [
    				listen(button, "click", stop_propagation(ctx.click_handler)),
    				listen(div, "contextmenu", prevent_default(ctx.contextmenu_handler)),
    				listen(div, "click", ctx.click_handler_6),
    				listen(div, "mousedown", ctx.mousedown_handler),
    				listen(div, "mousemove", ctx.mousemove_handler)
    			];
    		},

    		l: function claim(nodes) {
    			throw new Error_1("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},

    		m: function mount(target, anchor) {
    			insert(target, div, anchor);
    			append(div, button);
    			append(button, img);
    			append(div, t0);
    			append(div, h1);
    			append(div, t2);
    			append(div, style);
    			append(div, t4);

    			info.block.m(div, info.anchor = null);
    			info.mount = () => div;
    			info.anchor = t5;

    			append(div, t5);
    			mount_component(menu0, div, null);
    			append(div, t6);
    			mount_component(menu1, div, null);
    			append(div, t7);

    			for (var i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(div, null);
    			}

    			current = true;
    		},

    		p: function update(changed, new_ctx) {
    			ctx = new_ctx;
    			info.ctx = ctx;

    			if (('promise' in changed) && promise_1 !== (promise_1 = ctx.promise) && handle_promise(promise_1, info)) ; else {
    				info.block.p(changed, assign(assign({}, ctx), info.resolved));
    			}

    			var menu0_changes = {};
    			if (changed.showMenu) menu0_changes.show = ctx.showMenu;
    			if (changed.menuX) menu0_changes.x = ctx.menuX;
    			if (changed.menuY) menu0_changes.y = ctx.menuY;
    			if (changed.initSms || changed.showStateEditor || changed.showMenu) menu0_changes.items = [
    		{
    			label: 'SMS til giver', icon: '/images/sms.png',
    			action: ctx.func_2
    		},
    		{
    			label: 'SMS til henter', icon: '/images/sms.png',
    			action: ctx.func_3
    		},
    		{
    			label: 'Sett status', icon: '/images/wrench.png',
    			action: ctx.func_4
    		},
    	];
    			menu0.$set(menu0_changes);

    			var menu1_changes = {};
    			if (changed.showConfigMenu) menu1_changes.show = ctx.showConfigMenu;
    			if (changed.menuX) menu1_changes.x = ctx.menuX;
    			if (changed.menuY) menu1_changes.y = ctx.menuY;
    			if (changed.showDriverEditor || changed.showConfigMenu || changed.reload || changed.selectAllShown || changed.selectedItems) menu1_changes.items = [
    		{
    			label: 'Hentere', icon: '/images/smallcar.png',
    			action: ctx.func_5
    		},
    		{
    			label: 'Oppdater data', icon: '/images/wrench.png',
    			action: ctx.func_6
    		},
    		{
    			label: 'Merk alle', icon: '/images/check.png',
    			action: ctx.func_7
    		},
    		{
    			label: 'Fjern merking', icon: '/images/nocheck.png',
    			action: ctx.func_8
    		},
    	];
    			menu1.$set(menu1_changes);

    			if (changed.tempMsgQueue) {
    				each_value = ctx.tempMsgQueue;

    				for (var i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context$8(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(changed, child_ctx);
    						transition_in(each_blocks[i], 1);
    					} else {
    						each_blocks[i] = create_each_block$8(child_ctx);
    						each_blocks[i].c();
    						transition_in(each_blocks[i], 1);
    						each_blocks[i].m(div, null);
    					}
    				}

    				group_outros();
    				for (i = each_value.length; i < each_blocks.length; i += 1) out(i);
    				check_outros();
    			}
    		},

    		i: function intro(local) {
    			if (current) return;
    			transition_in(info.block);

    			transition_in(menu0.$$.fragment, local);

    			transition_in(menu1.$$.fragment, local);

    			for (var i = 0; i < each_value.length; i += 1) transition_in(each_blocks[i]);

    			current = true;
    		},

    		o: function outro(local) {
    			for (let i = 0; i < 3; i += 1) {
    				const block = info.blocks[i];
    				transition_out(block);
    			}

    			transition_out(menu0.$$.fragment, local);
    			transition_out(menu1.$$.fragment, local);

    			each_blocks = each_blocks.filter(Boolean);
    			for (let i = 0; i < each_blocks.length; i += 1) transition_out(each_blocks[i]);

    			current = false;
    		},

    		d: function destroy(detaching) {
    			if (detaching) {
    				detach(div);
    			}

    			info.block.d();
    			info.token = null;
    			info = null;

    			destroy_component(menu0);

    			destroy_component(menu1);

    			destroy_each(each_blocks, detaching);

    			run_all(dispose);
    		}
    	};
    }

    let monActive = true;

    async function getData(forceReload) {
    	const res = await fetch(`${apiUrl}/jobs` + (forceReload ? '?refresh=1' : ''));
    	if (res.ok) {
    		let json = await res.json();
    		json.sort(
    			(a, b) => a.adresseforhenting < b.adresseforhenting ? -1 : 1
    		);
    		json.forEach(item => {
    			item.status = item.status || '';
    		});
    		jobs.set(json);
    		return true;
    	} else {
    		let text = await res.text();
    		console.log(text);
    		throw new Error('Ingen tilgang');
    	}
    }

    async function getToken() {
    	const res = await fetch(`${apiUrl}/helpertoken`);
    	const data = await res.json();
    	return data.token;
    }

    function func(item) {
    	return item.status === 'Hentes';
    }

    function func_1(item) {
    	return item.status === 'Hentet';
    }

    function instance$d($$self, $$props, $$invalidate) {
    	let $jobs, $drivers;

    	validate_store(jobs, 'jobs');
    	component_subscribe($$self, jobs, $$value => { $jobs = $$value; $$invalidate('$jobs', $jobs); });
    	validate_store(drivers, 'drivers');
    	component_subscribe($$self, drivers, $$value => { $drivers = $$value; $$invalidate('$drivers', $drivers); });

    	
    	let smsEditorType = '';
    	let showDriverEditor = false;
    	let showStateEditor = false;
    	let showMenu = false;
    	let showConfigMenu = false;
    	let promise = getData();
    	let freeTextFilter = '';
    	let bigActive = true;
    	let smallActive = true;
    	let tueActive = true;
    	let wedActive = true;
    	let thuActive = true;
    	let dayFilterExclusive = false;
    	let typeFilter = '';
    	let types = [
    		'',
    		'Møbler',
    		'Bøker',
    		'Musikk',
    		'Klær',
    		'Film',
    		'Sykler',
    		'Elektrisk',
    		'Sportsutstyr',
    		'Kjøkkenutstyr',
    		'Leker'
    	];
    	let selectedItems = [];
    	// SMS editor vars
    	let possibleRecipients;
    	let recipients = [];
    	let message = '';
    	let hideDoneJobs = true;
    	let menuX = 0;
    	let menuY = 0;
    	let helperToken;
    	let tempMsgQueue = [];
    	getToken().then(t => { const $$result = helperToken = t; return $$result; });

    	function reload() {
    		$$invalidate('promise', promise = getData(true));
    	}

    	function updatedSelectedList(event) {
    		let detail = event.detail;
    		if (detail.selected && selectedItems.indexOf(detail.id) === -1) {
    			$$invalidate('selectedItems', selectedItems = [...selectedItems, detail.id]);
    		} else if (!detail.selected && selectedItems.indexOf(detail.id) > -1) {
    			selectedItems.splice(selectedItems.indexOf(detail.id), 1);
    			$$invalidate('selectedItems', selectedItems);
    		}
    	}

    	function toggleMenu(targetElm) {
    		if (showMenu) {
    			$$invalidate('showMenu', showMenu = false);
    		} else {
    			let jobId;
    			let elm = targetElm;
    			while(elm && !jobId && elm.getAttribute) {
    				jobId = elm.getAttribute('data-id');
    				elm = elm.parentNode;
    			}
    			if (jobId && selectedItems.indexOf(jobId) === -1) {
    				updatedSelectedList({detail: {selected: true, id: jobId}});
    			}
    			if (jobId || selectedItems.length) {
    				$$invalidate('showMenu', showMenu = true);
    			}
    		}
    	}
    	function considerClosingMenu(event) {
    		let insideMenu = false;
    		if (!(showMenu || showConfigMenu)) {
    			return; // nothing to do
    		}
    		let elm = event.target;
    		console.log(elm, elm.className);
    		while(elm) {
    			if (elm.className && elm.className.indexOf('menu') > -1) {
    				insideMenu = true;
    			}
    			elm = elm.parentNode;
    		}
    		if (insideMenu) {
    			return;
    		}
    		$$invalidate('showMenu', showMenu = false);
    		$$invalidate('showConfigMenu', showConfigMenu = false);
    	}
    	function onMouseDown(evt) {
    		if (showMenu || showConfigMenu) {return;}
    		$$invalidate('menuX', menuX = event.clientX);
    		// nudge menu left- og rightwards if the touch or
    		//mouse cursor is too near edge
    		if (menuX < window.innerWidth * 0.2) {
    			$$invalidate('menuX', menuX += window.innerWidth * 0.1);
    		}
    		if (menuX >= window.innerWidth - 200) {
    			$$invalidate('menuX', menuX -= 200);
    		}
    		$$invalidate('menuY', menuY = event.clientY);
    	}

    	function flashMessage(message, isError) {
    		$$invalidate('tempMsgQueue', tempMsgQueue = [...tempMsgQueue, {message, isError}]);
    		setTimeout(() =>
    			{ const $$result = tempMsgQueue = tempMsgQueue.slice(0, tempMsgQueue.length - 1); $$invalidate('tempMsgQueue', tempMsgQueue); return $$result; },
    		5000);
    	}

    	function initSms(type) {
    		$$invalidate('showMenu', showMenu = false);
    		let items = selectedItems
    			.map(item => $jobs.find(job => job.id === item));
    		if (type === 'donor') {
    			$$invalidate('possibleRecipients', possibleRecipients = items.map(item => ({
    				name: item.navnpåkontaktperson, number: item.telefonnummer,
    				address: item.adresseforhenting,
    			})));
    			$$invalidate('recipients', recipients = items.map(item => item.telefonnummer));
    			$$invalidate('smsEditorType', smsEditorType = type);
    		} else {
    			$$invalidate('possibleRecipients', possibleRecipients = $drivers);
    			$$invalidate('message', message = 'Hei, foreslår at du henter følgende jobb(er): \n\n' + 
    				items.map(item => `${item.adresseforhenting}
${item.navnpåkontaktperson}, ${item.telefonnummer}`)
    				.join('\n\n'));
    			$$invalidate('message', message += `

Merk jobber som hentet her etterpå:
${baseUrl}/henting/?jobb=${
	encodeURIComponent(items.map(item => getIdFromUrl(item.id)).join(','))
}&token=${encodeURIComponent(helperToken)}&henter={number}`);
    			$$invalidate('smsEditorType', smsEditorType = type);
    		}
    	}

    	function selectAllShown() {
    		selectedItems.length = 0; $$invalidate('selectedItems', selectedItems);
    		$jobs.forEach(item => {
    			if (filter(freeTextFilter, {smallActive, bigActive}, 
    				{monActive, tueActive, wedActive, thuActive, dayFilterExclusive}, 
    				typeFilter, hideDoneJobs, item)
    			) {
    				selectedItems.push(item.id);
    			}
    		});
    	}
    jobs.subscribe(data => {console.log('updated data! ', data);});

    	function click_handler(e) {showConfigMenu = true; $$invalidate('showConfigMenu', showConfigMenu);}

    	function input0_input_handler() {
    		freeTextFilter = this.value;
    		$$invalidate('freeTextFilter', freeTextFilter);
    	}

    	function click_handler_1(e) {
    		const $$result = bigActive = !bigActive;
    		$$invalidate('bigActive', bigActive);
    		return $$result;
    	}

    	function click_handler_2(e) {
    		const $$result = smallActive = !smallActive;
    		$$invalidate('smallActive', smallActive);
    		return $$result;
    	}

    	function select_change_handler() {
    		typeFilter = select_value(this);
    		$$invalidate('typeFilter', typeFilter);
    		$$invalidate('types', types);
    	}

    	function click_handler_3(e) {
    		const $$result = tueActive = !tueActive;
    		$$invalidate('tueActive', tueActive);
    		return $$result;
    	}

    	function click_handler_4(e) {
    		const $$result = wedActive = !wedActive;
    		$$invalidate('wedActive', wedActive);
    		return $$result;
    	}

    	function click_handler_5(e) {
    		const $$result = thuActive = !thuActive;
    		$$invalidate('thuActive', thuActive);
    		return $$result;
    	}

    	function input1_change_handler() {
    		dayFilterExclusive = this.checked;
    		$$invalidate('dayFilterExclusive', dayFilterExclusive);
    	}

    	function input2_change_handler() {
    		hideDoneJobs = this.checked;
    		$$invalidate('hideDoneJobs', hideDoneJobs);
    	}

    	function select_handler(e) {
    		return updatedSelectedList(e);
    	}

    	function cancel_handler(e) {
    					smsEditorType = ''; $$invalidate('smsEditorType', smsEditorType);
    					message = ''; $$invalidate('message', message);
    					possibleRecipients = null; $$invalidate('possibleRecipients', possibleRecipients);
    				}

    	function sms_handler(e) {
    					sendSms(e.detail.recipients, e.detail.message)
    					.then(() => flashMessage('SMS sendt til ' + e.detail.recipients ))
    					.catch(err => flashMessage(err, true));
    					message = ''; $$invalidate('message', message);
    					possibleRecipients = null; $$invalidate('possibleRecipients', possibleRecipients);
    					smsEditorType = ''; $$invalidate('smsEditorType', smsEditorType);
    				}

    	function close_handler() {
    		const $$result = smsEditorType = '';
    		$$invalidate('smsEditorType', smsEditorType);
    		return $$result;
    	}

    	function cancel_handler_1(e) {
    					showDriverEditor = false; $$invalidate('showDriverEditor', showDriverEditor);
    				}

    	function close_handler_1() {
    		const $$result = showDriverEditor = false;
    		$$invalidate('showDriverEditor', showDriverEditor);
    		return $$result;
    	}

    	function cancel_handler_2(e) {
    					showStateEditor = false; $$invalidate('showStateEditor', showStateEditor);
    				}

    	function statusupdate_handler(e) {
    					if (e.detail.newState) {
    						selectedItems.forEach(item => {
    							changeJobDetails(item, {status: e.detail.newState});
    						});
    					}
    					showStateEditor = false; $$invalidate('showStateEditor', showStateEditor);
    				}

    	function close_handler_2() {
    		const $$result = showStateEditor = false;
    		$$invalidate('showStateEditor', showStateEditor);
    		return $$result;
    	}

    	function func_2(e) {
    		return initSms('donor');
    	}

    	function func_3(e) {
    		return initSms('worker');
    	}

    	function func_4(e) {
    		const $$result = (showStateEditor = true, showMenu = false);
    		$$invalidate('showStateEditor', showStateEditor); $$invalidate('showMenu', showMenu);
    		return $$result;
    	}

    	function func_5(e) {
    		const $$result = (showDriverEditor = true, showConfigMenu = false);
    		$$invalidate('showDriverEditor', showDriverEditor); $$invalidate('showConfigMenu', showConfigMenu);
    		return $$result;
    	}

    	function func_6(e) {
    		const $$result = (showConfigMenu = false, reload());
    		$$invalidate('showConfigMenu', showConfigMenu);
    		return $$result;
    	}

    	function func_7(e) {
    		const $$result = (showConfigMenu = false, selectAllShown());
    		$$invalidate('showConfigMenu', showConfigMenu);
    		return $$result;
    	}

    	function func_8(e) {
    		const $$result = (showConfigMenu = false, selectedItems.length = 0);
    		$$invalidate('showConfigMenu', showConfigMenu); $$invalidate('selectedItems', selectedItems);
    		return $$result;
    	}

    	function contextmenu_handler(e) {
    			toggleMenu(e.target);
    		}

    	function click_handler_6(e) {
    		return considerClosingMenu(e);
    	}

    	function mousedown_handler(e) {
    		return onMouseDown();
    	}

    	function mousemove_handler(e) {
    		return onMouseDown();
    	}

    	return {
    		smsEditorType,
    		showDriverEditor,
    		showStateEditor,
    		showMenu,
    		showConfigMenu,
    		promise,
    		freeTextFilter,
    		bigActive,
    		smallActive,
    		tueActive,
    		wedActive,
    		thuActive,
    		dayFilterExclusive,
    		typeFilter,
    		types,
    		selectedItems,
    		possibleRecipients,
    		recipients,
    		message,
    		hideDoneJobs,
    		menuX,
    		menuY,
    		tempMsgQueue,
    		reload,
    		updatedSelectedList,
    		toggleMenu,
    		considerClosingMenu,
    		onMouseDown,
    		flashMessage,
    		initSms,
    		selectAllShown,
    		$jobs,
    		click_handler,
    		input0_input_handler,
    		click_handler_1,
    		click_handler_2,
    		select_change_handler,
    		click_handler_3,
    		click_handler_4,
    		click_handler_5,
    		input1_change_handler,
    		input2_change_handler,
    		select_handler,
    		cancel_handler,
    		sms_handler,
    		close_handler,
    		cancel_handler_1,
    		close_handler_1,
    		cancel_handler_2,
    		statusupdate_handler,
    		close_handler_2,
    		func_2,
    		func_3,
    		func_4,
    		func_5,
    		func_6,
    		func_7,
    		func_8,
    		contextmenu_handler,
    		click_handler_6,
    		mousedown_handler,
    		mousemove_handler
    	};
    }

    class App extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$d, create_fragment$d, safe_not_equal, []);
    	}
    }

    /* client/src/ShowSingleJob.svelte generated by Svelte v3.8.0 */
    const { Error: Error_1$1, Object: Object_1 } = globals;

    const file$e = "client/src/ShowSingleJob.svelte";

    function get_each_context$9(ctx, list, i) {
    	const child_ctx = Object_1.create(ctx);
    	child_ctx.job = list[i];
    	return child_ctx;
    }

    // (152:0) {:catch error}
    function create_catch_block$1(ctx) {
    	var p, t_value = ctx.error.message + "", t;

    	return {
    		c: function create() {
    			p = element("p");
    			t = text(t_value);
    			set_style(p, "color", "red");
    			add_location(p, file$e, 152, 1, 4088);
    		},

    		m: function mount(target, anchor) {
    			insert(target, p, anchor);
    			append(p, t);
    		},

    		p: function update_1(changed, ctx) {
    			if ((changed.promise) && t_value !== (t_value = ctx.error.message + "")) {
    				set_data(t, t_value);
    			}
    		},

    		i: noop,
    		o: noop,

    		d: function destroy(detaching) {
    			if (detaching) {
    				detach(p);
    			}
    		}
    	};
    }

    // (87:0) {:then data}
    function create_then_block$1(ctx) {
    	var each_1_anchor, current;

    	var each_value = ctx.$jobs;

    	var each_blocks = [];

    	for (var i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block$9(get_each_context$9(ctx, each_value, i));
    	}

    	const out = i => transition_out(each_blocks[i], 1, 1, () => {
    		each_blocks[i] = null;
    	});

    	return {
    		c: function create() {
    			for (var i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			each_1_anchor = empty();
    		},

    		m: function mount(target, anchor) {
    			for (var i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(target, anchor);
    			}

    			insert(target, each_1_anchor, anchor);
    			current = true;
    		},

    		p: function update_1(changed, ctx) {
    			if (changed.$jobs || changed.params || changed.encodeURIComponent) {
    				each_value = ctx.$jobs;

    				for (var i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context$9(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(changed, child_ctx);
    						transition_in(each_blocks[i], 1);
    					} else {
    						each_blocks[i] = create_each_block$9(child_ctx);
    						each_blocks[i].c();
    						transition_in(each_blocks[i], 1);
    						each_blocks[i].m(each_1_anchor.parentNode, each_1_anchor);
    					}
    				}

    				group_outros();
    				for (i = each_value.length; i < each_blocks.length; i += 1) out(i);
    				check_outros();
    			}
    		},

    		i: function intro(local) {
    			if (current) return;
    			for (var i = 0; i < each_value.length; i += 1) transition_in(each_blocks[i]);

    			current = true;
    		},

    		o: function outro(local) {
    			each_blocks = each_blocks.filter(Boolean);
    			for (let i = 0; i < each_blocks.length; i += 1) transition_out(each_blocks[i]);

    			current = false;
    		},

    		d: function destroy(detaching) {
    			destroy_each(each_blocks, detaching);

    			if (detaching) {
    				detach(each_1_anchor);
    			}
    		}
    	};
    }

    // (90:2) {#if job.loading}
    function create_if_block_2$3(ctx) {
    	var div, current;

    	var loadingicon = new LoadingIcon({ $$inline: true });

    	return {
    		c: function create() {
    			div = element("div");
    			loadingicon.$$.fragment.c();
    			attr(div, "class", "loading svelte-tjsvhh");
    			add_location(div, file$e, 89, 19, 2337);
    		},

    		m: function mount(target, anchor) {
    			insert(target, div, anchor);
    			mount_component(loadingicon, div, null);
    			current = true;
    		},

    		i: function intro(local) {
    			if (current) return;
    			transition_in(loadingicon.$$.fragment, local);

    			current = true;
    		},

    		o: function outro(local) {
    			transition_out(loadingicon.$$.fragment, local);
    			current = false;
    		},

    		d: function destroy(detaching) {
    			if (detaching) {
    				detach(div);
    			}

    			destroy_component(loadingicon);
    		}
    	};
    }

    // (109:3) {#if job.informasjonomloppene}
    function create_if_block_1$4(ctx) {
    	var p, b, i, t_1_value = ctx.job.informasjonomloppene + "", t_1;

    	return {
    		c: function create() {
    			p = element("p");
    			b = element("b");
    			b.textContent = "Om loppene: ";
    			i = element("i");
    			t_1 = text(t_1_value);
    			attr(b, "class", "svelte-tjsvhh");
    			add_location(b, file$e, 108, 37, 2890);
    			attr(i, "class", "svelte-tjsvhh");
    			add_location(i, file$e, 108, 56, 2909);
    			attr(p, "class", "svelte-tjsvhh");
    			add_location(p, file$e, 108, 34, 2887);
    		},

    		m: function mount(target, anchor) {
    			insert(target, p, anchor);
    			append(p, b);
    			append(p, i);
    			append(i, t_1);
    		},

    		p: function update_1(changed, ctx) {
    			if ((changed.$jobs) && t_1_value !== (t_1_value = ctx.job.informasjonomloppene + "")) {
    				set_data(t_1, t_1_value);
    			}
    		},

    		d: function destroy(detaching) {
    			if (detaching) {
    				detach(p);
    			}
    		}
    	};
    }

    // (116:5) {#if job.hentesav && job.hentesav === params.henter}
    function create_if_block$6(ctx) {
    	var br0, t0, em, br1, t1, em_transition, current;

    	return {
    		c: function create() {
    			br0 = element("br");
    			t0 = space();
    			em = element("em");
    			br1 = element("br");
    			t1 = text("★ ★ ☺   Du har tatt på deg jobben - takk!  ☺ ★ ★");
    			add_location(br0, file$e, 116, 6, 3235);
    			add_location(br1, file$e, 117, 26, 3266);
    			add_location(em, file$e, 117, 6, 3246);
    		},

    		m: function mount(target, anchor) {
    			insert(target, br0, anchor);
    			insert(target, t0, anchor);
    			insert(target, em, anchor);
    			append(em, br1);
    			append(em, t1);
    			current = true;
    		},

    		i: function intro(local) {
    			if (current) return;
    			add_render_callback(() => {
    				if (!em_transition) em_transition = create_bidirectional_transition(em, fade, {}, true);
    				em_transition.run(1);
    			});

    			current = true;
    		},

    		o: function outro(local) {
    			if (!em_transition) em_transition = create_bidirectional_transition(em, fade, {}, false);
    			em_transition.run(0);

    			current = false;
    		},

    		d: function destroy(detaching) {
    			if (detaching) {
    				detach(br0);
    				detach(t0);
    				detach(em);
    				if (em_transition) em_transition.end();
    			}
    		}
    	};
    }

    // (88:1) {#each $jobs as job}
    function create_each_block$9(ctx) {
    	var h1, t1, t2, section, p0, b0, t4, span0, t5_value = ctx.job.adresseforhenting + "", t5, t6, a, t7, a_href_value, t8, p1, b1, t10, span1, t11, p2, b2, t13, span2, t14, t15, p3, b3, span3, t17, p4, b4, span4, em, t19_value = ctx.job.status + "", t19, t20, br, t21, t22, p5, b5, span5, button0, t25, button1, t27, button2, t29, button3, t31, current, dispose;

    	var if_block0 = (ctx.job.loading) && create_if_block_2$3();

    	var renderperson = new RenderPerson({
    		props: {
    		name: ctx.job.navnpåkontaktperson,
    		number: ctx.job.telefonnummer
    	},
    		$$inline: true
    	});

    	var rendertypes = new RenderTypes({
    		props: {
    		types: ctx.job.typerlopper,
    		showAll: true
    	},
    		$$inline: true
    	});

    	var if_block1 = (ctx.job.informasjonomloppene) && create_if_block_1$4(ctx);

    	function qualityupdate_handler(...args) {
    		return ctx.qualityupdate_handler(ctx, ...args);
    	}

    	var renderstars = new RenderStars({
    		props: { qualityRanking: ctx.job.kvalitet },
    		$$inline: true
    	});
    	renderstars.$on("qualityupdate", qualityupdate_handler);

    	var if_block2 = (ctx.job.hentesav && ctx.job.hentesav === ctx.params.henter) && create_if_block$6();

    	function click_handler(...args) {
    		return ctx.click_handler(ctx, ...args);
    	}

    	function click_handler_1(...args) {
    		return ctx.click_handler_1(ctx, ...args);
    	}

    	function click_handler_2(...args) {
    		return ctx.click_handler_2(ctx, ...args);
    	}

    	function click_handler_3(...args) {
    		return ctx.click_handler_3(ctx, ...args);
    	}

    	return {
    		c: function create() {
    			h1 = element("h1");
    			h1.textContent = "Hentejobb";
    			t1 = space();
    			if (if_block0) if_block0.c();
    			t2 = space();
    			section = element("section");
    			p0 = element("p");
    			b0 = element("b");
    			b0.textContent = "Adresse:";
    			t4 = space();
    			span0 = element("span");
    			t5 = text(t5_value);
    			t6 = space();
    			a = element("a");
    			t7 = text("🔎");
    			t8 = space();
    			p1 = element("p");
    			b1 = element("b");
    			b1.textContent = "Kontaktperson:";
    			t10 = space();
    			span1 = element("span");
    			renderperson.$$.fragment.c();
    			t11 = space();
    			p2 = element("p");
    			b2 = element("b");
    			b2.textContent = "Typer:";
    			t13 = space();
    			span2 = element("span");
    			rendertypes.$$.fragment.c();
    			t14 = space();
    			if (if_block1) if_block1.c();
    			t15 = space();
    			p3 = element("p");
    			b3 = element("b");
    			b3.textContent = "Estimert kvalitet: ";
    			span3 = element("span");
    			renderstars.$$.fragment.c();
    			t17 = space();
    			p4 = element("p");
    			b4 = element("b");
    			b4.textContent = "Status: ";
    			span4 = element("span");
    			em = element("em");
    			t19 = text(t19_value);
    			t20 = space();
    			br = element("br");
    			t21 = space();
    			if (if_block2) if_block2.c();
    			t22 = space();
    			p5 = element("p");
    			b5 = element("b");
    			b5.textContent = "Oppdater status:";
    			span5 = element("span");
    			button0 = element("button");
    			button0.textContent = "Vi tar jobben!";
    			t25 = space();
    			button1 = element("button");
    			button1.textContent = "Ferdig hentet!";
    			t27 = space();
    			button2 = element("button");
    			button2.textContent = "Vi rekker ikke denne";
    			t29 = space();
    			button3 = element("button");
    			button3.textContent = "Jobben skal ikke hentes";
    			t31 = space();
    			attr(h1, "class", "svelte-tjsvhh");
    			add_location(h1, file$e, 88, 2, 2299);
    			attr(b0, "class", "svelte-tjsvhh");
    			add_location(b0, file$e, 92, 4, 2408);
    			attr(a, "href", a_href_value = "https://www.google.no/maps/?q=" + ctx.encodeURIComponent(ctx.job.adresseforhenting));
    			attr(a, "target", "_blank");
    			add_location(a, file$e, 94, 5, 2466);
    			attr(span0, "class", "svelte-tjsvhh");
    			add_location(span0, file$e, 92, 21, 2425);
    			attr(p0, "class", "svelte-tjsvhh");
    			add_location(p0, file$e, 91, 3, 2400);
    			attr(b1, "class", "svelte-tjsvhh");
    			add_location(b1, file$e, 100, 4, 2617);
    			attr(span1, "class", "svelte-tjsvhh");
    			add_location(span1, file$e, 101, 4, 2644);
    			attr(p1, "class", "svelte-tjsvhh");
    			add_location(p1, file$e, 99, 3, 2609);
    			attr(b2, "class", "svelte-tjsvhh");
    			add_location(b2, file$e, 106, 4, 2762);
    			attr(span2, "class", "svelte-tjsvhh");
    			add_location(span2, file$e, 106, 19, 2777);
    			attr(p2, "class", "svelte-tjsvhh");
    			add_location(p2, file$e, 105, 3, 2754);
    			attr(b3, "class", "svelte-tjsvhh");
    			add_location(b3, file$e, 109, 6, 2958);
    			attr(span3, "class", "svelte-tjsvhh");
    			add_location(span3, file$e, 109, 32, 2984);
    			attr(p3, "class", "svelte-tjsvhh");
    			add_location(p3, file$e, 109, 3, 2955);
    			attr(b4, "class", "svelte-tjsvhh");
    			add_location(b4, file$e, 113, 4, 3117);
    			add_location(em, file$e, 114, 5, 3144);
    			add_location(br, file$e, 114, 27, 3166);
    			attr(span4, "class", "svelte-tjsvhh");
    			add_location(span4, file$e, 113, 19, 3132);
    			attr(p4, "class", "svelte-tjsvhh");
    			add_location(p4, file$e, 112, 3, 3109);
    			attr(b5, "class", "svelte-tjsvhh");
    			add_location(b5, file$e, 122, 4, 3366);
    			attr(button0, "class", "p8 br2 svelte-tjsvhh");
    			add_location(button0, file$e, 123, 5, 3401);
    			attr(button1, "class", "p8 br2 svelte-tjsvhh");
    			add_location(button1, file$e, 129, 5, 3561);
    			attr(button2, "class", "p8 br2 svelte-tjsvhh");
    			add_location(button2, file$e, 135, 5, 3721);
    			attr(button3, "class", "p8 br2 svelte-tjsvhh");
    			add_location(button3, file$e, 141, 5, 3872);
    			attr(span5, "class", "svelte-tjsvhh");
    			add_location(span5, file$e, 122, 27, 3389);
    			attr(p5, "class", "svelte-tjsvhh");
    			add_location(p5, file$e, 121, 3, 3358);
    			attr(section, "class", "svelte-tjsvhh");
    			add_location(section, file$e, 90, 2, 2387);

    			dispose = [
    				listen(button0, "click", click_handler),
    				listen(button1, "click", click_handler_1),
    				listen(button2, "click", click_handler_2),
    				listen(button3, "click", click_handler_3)
    			];
    		},

    		m: function mount(target, anchor) {
    			insert(target, h1, anchor);
    			insert(target, t1, anchor);
    			if (if_block0) if_block0.m(target, anchor);
    			insert(target, t2, anchor);
    			insert(target, section, anchor);
    			append(section, p0);
    			append(p0, b0);
    			append(p0, t4);
    			append(p0, span0);
    			append(span0, t5);
    			append(span0, t6);
    			append(span0, a);
    			append(a, t7);
    			append(section, t8);
    			append(section, p1);
    			append(p1, b1);
    			append(p1, t10);
    			append(p1, span1);
    			mount_component(renderperson, span1, null);
    			append(section, t11);
    			append(section, p2);
    			append(p2, b2);
    			append(p2, t13);
    			append(p2, span2);
    			mount_component(rendertypes, span2, null);
    			append(section, t14);
    			if (if_block1) if_block1.m(section, null);
    			append(section, t15);
    			append(section, p3);
    			append(p3, b3);
    			append(p3, span3);
    			mount_component(renderstars, span3, null);
    			append(section, t17);
    			append(section, p4);
    			append(p4, b4);
    			append(p4, span4);
    			append(span4, em);
    			append(em, t19);
    			append(span4, t20);
    			append(span4, br);
    			append(span4, t21);
    			if (if_block2) if_block2.m(span4, null);
    			append(section, t22);
    			append(section, p5);
    			append(p5, b5);
    			append(p5, span5);
    			append(span5, button0);
    			append(span5, t25);
    			append(span5, button1);
    			append(span5, t27);
    			append(span5, button2);
    			append(span5, t29);
    			append(span5, button3);
    			append(section, t31);
    			current = true;
    		},

    		p: function update_1(changed, new_ctx) {
    			ctx = new_ctx;
    			if (ctx.job.loading) {
    				if (!if_block0) {
    					if_block0 = create_if_block_2$3();
    					if_block0.c();
    					transition_in(if_block0, 1);
    					if_block0.m(t2.parentNode, t2);
    				} else {
    									transition_in(if_block0, 1);
    				}
    			} else if (if_block0) {
    				group_outros();
    				transition_out(if_block0, 1, 1, () => {
    					if_block0 = null;
    				});
    				check_outros();
    			}

    			if ((!current || changed.$jobs) && t5_value !== (t5_value = ctx.job.adresseforhenting + "")) {
    				set_data(t5, t5_value);
    			}

    			if ((!current || changed.$jobs) && a_href_value !== (a_href_value = "https://www.google.no/maps/?q=" + ctx.encodeURIComponent(ctx.job.adresseforhenting))) {
    				attr(a, "href", a_href_value);
    			}

    			var renderperson_changes = {};
    			if (changed.$jobs) renderperson_changes.name = ctx.job.navnpåkontaktperson;
    			if (changed.$jobs) renderperson_changes.number = ctx.job.telefonnummer;
    			renderperson.$set(renderperson_changes);

    			var rendertypes_changes = {};
    			if (changed.$jobs) rendertypes_changes.types = ctx.job.typerlopper;
    			rendertypes.$set(rendertypes_changes);

    			if (ctx.job.informasjonomloppene) {
    				if (if_block1) {
    					if_block1.p(changed, ctx);
    				} else {
    					if_block1 = create_if_block_1$4(ctx);
    					if_block1.c();
    					if_block1.m(section, t15);
    				}
    			} else if (if_block1) {
    				if_block1.d(1);
    				if_block1 = null;
    			}

    			var renderstars_changes = {};
    			if (changed.$jobs) renderstars_changes.qualityRanking = ctx.job.kvalitet;
    			renderstars.$set(renderstars_changes);

    			if ((!current || changed.$jobs) && t19_value !== (t19_value = ctx.job.status + "")) {
    				set_data(t19, t19_value);
    			}

    			if (ctx.job.hentesav && ctx.job.hentesav === ctx.params.henter) {
    				if (!if_block2) {
    					if_block2 = create_if_block$6();
    					if_block2.c();
    					transition_in(if_block2, 1);
    					if_block2.m(span4, null);
    				} else {
    									transition_in(if_block2, 1);
    				}
    			} else if (if_block2) {
    				group_outros();
    				transition_out(if_block2, 1, 1, () => {
    					if_block2 = null;
    				});
    				check_outros();
    			}
    		},

    		i: function intro(local) {
    			if (current) return;
    			transition_in(if_block0);

    			transition_in(renderperson.$$.fragment, local);

    			transition_in(rendertypes.$$.fragment, local);

    			transition_in(renderstars.$$.fragment, local);

    			transition_in(if_block2);
    			current = true;
    		},

    		o: function outro(local) {
    			transition_out(if_block0);
    			transition_out(renderperson.$$.fragment, local);
    			transition_out(rendertypes.$$.fragment, local);
    			transition_out(renderstars.$$.fragment, local);
    			transition_out(if_block2);
    			current = false;
    		},

    		d: function destroy(detaching) {
    			if (detaching) {
    				detach(h1);
    				detach(t1);
    			}

    			if (if_block0) if_block0.d(detaching);

    			if (detaching) {
    				detach(t2);
    				detach(section);
    			}

    			destroy_component(renderperson);

    			destroy_component(rendertypes);

    			if (if_block1) if_block1.d();

    			destroy_component(renderstars);

    			if (if_block2) if_block2.d();
    			run_all(dispose);
    		}
    	};
    }

    // (85:16)   <div class="loading"><LoadingIcon /></div> {:then data}
    function create_pending_block$1(ctx) {
    	var div, current;

    	var loadingicon = new LoadingIcon({ $$inline: true });

    	return {
    		c: function create() {
    			div = element("div");
    			loadingicon.$$.fragment.c();
    			attr(div, "class", "loading svelte-tjsvhh");
    			add_location(div, file$e, 85, 1, 2219);
    		},

    		m: function mount(target, anchor) {
    			insert(target, div, anchor);
    			mount_component(loadingicon, div, null);
    			current = true;
    		},

    		p: noop,

    		i: function intro(local) {
    			if (current) return;
    			transition_in(loadingicon.$$.fragment, local);

    			current = true;
    		},

    		o: function outro(local) {
    			transition_out(loadingicon.$$.fragment, local);
    			current = false;
    		},

    		d: function destroy(detaching) {
    			if (detaching) {
    				detach(div);
    			}

    			destroy_component(loadingicon);
    		}
    	};
    }

    function create_fragment$e(ctx) {
    	var await_block_anchor, promise_1, current;

    	let info = {
    		ctx,
    		current: null,
    		token: null,
    		pending: create_pending_block$1,
    		then: create_then_block$1,
    		catch: create_catch_block$1,
    		value: 'data',
    		error: 'error',
    		blocks: [,,,]
    	};

    	handle_promise(promise_1 = ctx.promise, info);

    	return {
    		c: function create() {
    			await_block_anchor = empty();

    			info.block.c();
    		},

    		l: function claim(nodes) {
    			throw new Error_1$1("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},

    		m: function mount(target, anchor) {
    			insert(target, await_block_anchor, anchor);

    			info.block.m(target, info.anchor = anchor);
    			info.mount = () => await_block_anchor.parentNode;
    			info.anchor = await_block_anchor;

    			current = true;
    		},

    		p: function update_1(changed, new_ctx) {
    			ctx = new_ctx;
    			info.ctx = ctx;

    			if (('promise' in changed) && promise_1 !== (promise_1 = ctx.promise) && handle_promise(promise_1, info)) ; else {
    				info.block.p(changed, assign(assign({}, ctx), info.resolved));
    			}
    		},

    		i: function intro(local) {
    			if (current) return;
    			transition_in(info.block);
    			current = true;
    		},

    		o: function outro(local) {
    			for (let i = 0; i < 3; i += 1) {
    				const block = info.blocks[i];
    				transition_out(block);
    			}

    			current = false;
    		},

    		d: function destroy(detaching) {
    			if (detaching) {
    				detach(await_block_anchor);
    			}

    			info.block.d(detaching);
    			info.token = null;
    			info = null;
    		}
    	};
    }

    async function getData$1(token, ids) {
    	const res = await fetch(`${apiUrl}/job/${encodeURIComponent(ids)}?token=${encodeURIComponent(token)}`);
    	let json = await res.json();
    	if (res.ok) {
    		json = json.sort(
    			(a, b) => a.adresseforhenting < b.adresseforhenting ? -1 : 1
    		);
    		jobs.set(json);
    	} else {
    		let text = await res.text();
    		console.log(text);
    		throw new Error('Ingen tilgang');
    	}
    }

    function instance$e($$self, $$props, $$invalidate) {
    	let $jobs;

    	validate_store(jobs, 'jobs');
    	component_subscribe($$self, jobs, $$value => { $jobs = $$value; $$invalidate('$jobs', $jobs); });

    	

    	let params, promise;
    	if (typeof location !== "undefined") {
    		$$invalidate('params', params = location.search
    			.substr(1)
    			.split(/&/g)
    			.map(item => {
    				let parts = item.split(/=/);
    				return { [parts[0]]: decodeURIComponent(parts[1]) };
    			})
    			.reduce((all, now) => Object.assign(all, now), {}));
    	}
    	if (params && (params.token && params.jobb)) {
    		$$invalidate('promise', promise = getData$1(params.token, params.jobb));

    	}
    	
    	function update(id, detail) {
    		return changeJobDetails(id, detail, params.token)
    		.catch(err => alert(err));
    	}
    jobs.subscribe(data => {console.log('updated data! ', data);});

    	function qualityupdate_handler({ job }, e) {
    		return update(job.id, e.detail);
    	}

    	function click_handler({ job }, e) {
    		return update(job.id, {status: 'Hentes', hentesav: params.henter});
    	}

    	function click_handler_1({ job }, e) {
    		return update(job.id, {status: 'Hentet', hentesav: params.henter});
    	}

    	function click_handler_2({ job }, e) {
    		return update(job.id, {status: 'Ny', hentesav: ''});
    	}

    	function click_handler_3({ job }, e) {
    		return update(job.id, {status: 'Hentes ikke', hentesav: ''});
    	}

    	return {
    		params,
    		promise,
    		update,
    		encodeURIComponent,
    		$jobs,
    		qualityupdate_handler,
    		click_handler,
    		click_handler_1,
    		click_handler_2,
    		click_handler_3
    	};
    }

    class ShowSingleJob extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$e, create_fragment$e, safe_not_equal, []);
    	}
    }

    var app;
    // basic "routing" for load-once-never-leave pages
    if (typeof location !== 'undefined') {
    	let chosen = {
    		'/': App,
    		'/henting/': ShowSingleJob
    	}[location.pathname];
    	app = new chosen({
    		target: document.body
    	});
    } else {
    	app = new App({
    		target: document.body
    	});
    }

    var app$1 = app;

    return app$1;

}());
//# sourceMappingURL=bundle.js.map
