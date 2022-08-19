
(function(l, r) { if (!l || l.getElementById('livereloadscript')) return; r = l.createElement('script'); r.async = 1; r.src = '//' + (self.location.host || 'localhost').split(':')[0] + ':35729/livereload.js?snipver=1'; r.id = 'livereloadscript'; l.getElementsByTagName('head')[0].appendChild(r) })(self.document);
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
    let src_url_equal_anchor;
    function src_url_equal(element_src, url) {
        if (!src_url_equal_anchor) {
            src_url_equal_anchor = document.createElement('a');
        }
        src_url_equal_anchor.href = url;
        return element_src === src_url_equal_anchor.href;
    }
    function is_empty(obj) {
        return Object.keys(obj).length === 0;
    }
    function subscribe(store, ...callbacks) {
        if (store == null) {
            return noop;
        }
        const unsub = store.subscribe(...callbacks);
        return unsub.unsubscribe ? () => unsub.unsubscribe() : unsub;
    }
    function component_subscribe(component, store, callback) {
        component.$$.on_destroy.push(subscribe(store, callback));
    }
    function create_slot(definition, ctx, $$scope, fn) {
        if (definition) {
            const slot_ctx = get_slot_context(definition, ctx, $$scope, fn);
            return definition[0](slot_ctx);
        }
    }
    function get_slot_context(definition, ctx, $$scope, fn) {
        return definition[1] && fn
            ? assign($$scope.ctx.slice(), definition[1](fn(ctx)))
            : $$scope.ctx;
    }
    function get_slot_changes(definition, $$scope, dirty, fn) {
        if (definition[2] && fn) {
            const lets = definition[2](fn(dirty));
            if ($$scope.dirty === undefined) {
                return lets;
            }
            if (typeof lets === 'object') {
                const merged = [];
                const len = Math.max($$scope.dirty.length, lets.length);
                for (let i = 0; i < len; i += 1) {
                    merged[i] = $$scope.dirty[i] | lets[i];
                }
                return merged;
            }
            return $$scope.dirty | lets;
        }
        return $$scope.dirty;
    }
    function update_slot_base(slot, slot_definition, ctx, $$scope, slot_changes, get_slot_context_fn) {
        if (slot_changes) {
            const slot_context = get_slot_context(slot_definition, ctx, $$scope, get_slot_context_fn);
            slot.p(slot_context, slot_changes);
        }
    }
    function get_all_dirty_from_scope($$scope) {
        if ($$scope.ctx.length > 32) {
            const dirty = [];
            const length = $$scope.ctx.length / 32;
            for (let i = 0; i < length; i++) {
                dirty[i] = -1;
            }
            return dirty;
        }
        return -1;
    }
    function null_to_empty(value) {
        return value == null ? '' : value;
    }

    const is_client = typeof window !== 'undefined';
    let now = is_client
        ? () => window.performance.now()
        : () => Date.now();
    let raf = is_client ? cb => requestAnimationFrame(cb) : noop;

    const tasks = new Set();
    function run_tasks(now) {
        tasks.forEach(task => {
            if (!task.c(now)) {
                tasks.delete(task);
                task.f();
            }
        });
        if (tasks.size !== 0)
            raf(run_tasks);
    }
    /**
     * Creates a new task that runs on each raf frame
     * until it returns a falsy value or is aborted
     */
    function loop(callback) {
        let task;
        if (tasks.size === 0)
            raf(run_tasks);
        return {
            promise: new Promise(fulfill => {
                tasks.add(task = { c: callback, f: fulfill });
            }),
            abort() {
                tasks.delete(task);
            }
        };
    }
    function append(target, node) {
        target.appendChild(node);
    }
    function append_styles(target, style_sheet_id, styles) {
        const append_styles_to = get_root_for_style(target);
        if (!append_styles_to.getElementById(style_sheet_id)) {
            const style = element('style');
            style.id = style_sheet_id;
            style.textContent = styles;
            append_stylesheet(append_styles_to, style);
        }
    }
    function get_root_for_style(node) {
        if (!node)
            return document;
        const root = node.getRootNode ? node.getRootNode() : node.ownerDocument;
        if (root && root.host) {
            return root;
        }
        return node.ownerDocument;
    }
    function append_empty_stylesheet(node) {
        const style_element = element('style');
        append_stylesheet(get_root_for_style(node), style_element);
        return style_element.sheet;
    }
    function append_stylesheet(node, style) {
        append(node.head || node, style);
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
        else if (node.getAttribute(attribute) !== value)
            node.setAttribute(attribute, value);
    }
    function children(element) {
        return Array.from(element.childNodes);
    }
    function set_data(text, data) {
        data = '' + data;
        if (text.wholeText !== data)
            text.data = data;
    }
    function set_input_value(input, value) {
        input.value = value == null ? '' : value;
    }
    function set_style(node, key, value, important) {
        if (value === null) {
            node.style.removeProperty(key);
        }
        else {
            node.style.setProperty(key, value, important ? 'important' : '');
        }
    }
    function select_option(select, value) {
        for (let i = 0; i < select.options.length; i += 1) {
            const option = select.options[i];
            if (option.__value === value) {
                option.selected = true;
                return;
            }
        }
        select.selectedIndex = -1; // no option should be selected
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
    function custom_event(type, detail, { bubbles = false, cancelable = false } = {}) {
        const e = document.createEvent('CustomEvent');
        e.initCustomEvent(type, bubbles, cancelable, detail);
        return e;
    }

    // we need to store the information for multiple documents because a Svelte application could also contain iframes
    // https://github.com/sveltejs/svelte/issues/3624
    const managed_styles = new Map();
    let active = 0;
    // https://github.com/darkskyapp/string-hash/blob/master/index.js
    function hash(str) {
        let hash = 5381;
        let i = str.length;
        while (i--)
            hash = ((hash << 5) - hash) ^ str.charCodeAt(i);
        return hash >>> 0;
    }
    function create_style_information(doc, node) {
        const info = { stylesheet: append_empty_stylesheet(node), rules: {} };
        managed_styles.set(doc, info);
        return info;
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
        const doc = get_root_for_style(node);
        const { stylesheet, rules } = managed_styles.get(doc) || create_style_information(doc, node);
        if (!rules[name]) {
            rules[name] = true;
            stylesheet.insertRule(`@keyframes ${name} ${rule}`, stylesheet.cssRules.length);
        }
        const animation = node.style.animation || '';
        node.style.animation = `${animation ? `${animation}, ` : ''}${name} ${duration}ms linear ${delay}ms 1 both`;
        active += 1;
        return name;
    }
    function delete_rule(node, name) {
        const previous = (node.style.animation || '').split(', ');
        const next = previous.filter(name
            ? anim => anim.indexOf(name) < 0 // remove specific animation
            : anim => anim.indexOf('__svelte') === -1 // remove all Svelte animations
        );
        const deleted = previous.length - next.length;
        if (deleted) {
            node.style.animation = next.join(', ');
            active -= deleted;
            if (!active)
                clear_rules();
        }
    }
    function clear_rules() {
        raf(() => {
            if (active)
                return;
            managed_styles.forEach(info => {
                const { stylesheet } = info;
                let i = stylesheet.cssRules.length;
                while (i--)
                    stylesheet.deleteRule(i);
                info.rules = {};
            });
            managed_styles.clear();
        });
    }

    let current_component;
    function set_current_component(component) {
        current_component = component;
    }
    function get_current_component() {
        if (!current_component)
            throw new Error('Function called outside component initialization');
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
        const component = get_current_component();
        return (type, detail, { cancelable = false } = {}) => {
            const callbacks = component.$$.callbacks[type];
            if (callbacks) {
                // TODO are there situations where events could be dispatched
                // in a server (non-DOM) environment?
                const event = custom_event(type, detail, { cancelable });
                callbacks.slice().forEach(fn => {
                    fn.call(component, event);
                });
                return !event.defaultPrevented;
            }
            return true;
        };
    }
    // TODO figure out if we still want to support
    // shorthand events, or if we want to implement
    // a real bubbling mechanism
    function bubble(component, event) {
        const callbacks = component.$$.callbacks[event.type];
        if (callbacks) {
            // @ts-ignore
            callbacks.slice().forEach(fn => fn.call(this, event));
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
    // flush() calls callbacks in this order:
    // 1. All beforeUpdate callbacks, in order: parents before children
    // 2. All bind:this callbacks, in reverse order: children before parents.
    // 3. All afterUpdate callbacks, in order: parents before children. EXCEPT
    //    for afterUpdates called during the initial onMount, which are called in
    //    reverse order: children before parents.
    // Since callbacks might update component values, which could trigger another
    // call to flush(), the following steps guard against this:
    // 1. During beforeUpdate, any updated components will be added to the
    //    dirty_components array and will cause a reentrant call to flush(). Because
    //    the flush index is kept outside the function, the reentrant call will pick
    //    up where the earlier call left off and go through all dirty components. The
    //    current_component value is saved and restored so that the reentrant call will
    //    not interfere with the "parent" flush() call.
    // 2. bind:this callbacks cannot trigger new flush() calls.
    // 3. During afterUpdate, any updated components will NOT have their afterUpdate
    //    callback called a second time; the seen_callbacks set, outside the flush()
    //    function, guarantees this behavior.
    const seen_callbacks = new Set();
    let flushidx = 0; // Do *not* move this inside the flush() function
    function flush() {
        const saved_component = current_component;
        do {
            // first, call beforeUpdate functions
            // and update components
            while (flushidx < dirty_components.length) {
                const component = dirty_components[flushidx];
                flushidx++;
                set_current_component(component);
                update(component.$$);
            }
            set_current_component(null);
            dirty_components.length = 0;
            flushidx = 0;
            while (binding_callbacks.length)
                binding_callbacks.pop()();
            // then, once components are updated, call
            // afterUpdate functions. This may cause
            // subsequent updates...
            for (let i = 0; i < render_callbacks.length; i += 1) {
                const callback = render_callbacks[i];
                if (!seen_callbacks.has(callback)) {
                    // ...so guard against infinite loops
                    seen_callbacks.add(callback);
                    callback();
                }
            }
            render_callbacks.length = 0;
        } while (dirty_components.length);
        while (flush_callbacks.length) {
            flush_callbacks.pop()();
        }
        update_scheduled = false;
        seen_callbacks.clear();
        set_current_component(saved_component);
    }
    function update($$) {
        if ($$.fragment !== null) {
            $$.update();
            run_all($$.before_update);
            const dirty = $$.dirty;
            $$.dirty = [-1];
            $$.fragment && $$.fragment.p($$.ctx, dirty);
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
        else if (callback) {
            callback();
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
            const d = (program.b - t);
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
            if (running_program || pending_program) {
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
            info.resolved = value;
            let child_ctx = info.ctx;
            if (key !== undefined) {
                child_ctx = child_ctx.slice();
                child_ctx[key] = value;
            }
            const block = type && (info.current = type)(child_ctx);
            let needs_flush = false;
            if (info.block) {
                if (info.blocks) {
                    info.blocks.forEach((block, i) => {
                        if (i !== index && block) {
                            group_outros();
                            transition_out(block, 1, 1, () => {
                                if (info.blocks[i] === block) {
                                    info.blocks[i] = null;
                                }
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
                needs_flush = true;
            }
            info.block = block;
            if (info.blocks)
                info.blocks[index] = block;
            if (needs_flush) {
                flush();
            }
        }
        if (is_promise(promise)) {
            const current_component = get_current_component();
            promise.then(value => {
                set_current_component(current_component);
                update(info.then, 1, info.value, value);
                set_current_component(null);
            }, error => {
                set_current_component(current_component);
                update(info.catch, 2, info.error, error);
                set_current_component(null);
                if (!info.hasCatch) {
                    throw error;
                }
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
            info.resolved = promise;
        }
    }
    function update_await_block_branch(info, ctx, dirty) {
        const child_ctx = ctx.slice();
        const { resolved } = info;
        if (info.current === info.then) {
            child_ctx[info.value] = resolved;
        }
        if (info.current === info.catch) {
            child_ctx[info.error] = resolved;
        }
        info.block.p(child_ctx, dirty);
    }

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
    function get_spread_object(spread_props) {
        return typeof spread_props === 'object' && spread_props !== null ? spread_props : {};
    }
    function create_component(block) {
        block && block.c();
    }
    function mount_component(component, target, anchor, customElement) {
        const { fragment, on_mount, on_destroy, after_update } = component.$$;
        fragment && fragment.m(target, anchor);
        if (!customElement) {
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
        }
        after_update.forEach(add_render_callback);
    }
    function destroy_component(component, detaching) {
        const $$ = component.$$;
        if ($$.fragment !== null) {
            run_all($$.on_destroy);
            $$.fragment && $$.fragment.d(detaching);
            // TODO null out other refs, including component.$$ (but need to
            // preserve final state?)
            $$.on_destroy = $$.fragment = null;
            $$.ctx = [];
        }
    }
    function make_dirty(component, i) {
        if (component.$$.dirty[0] === -1) {
            dirty_components.push(component);
            schedule_update();
            component.$$.dirty.fill(0);
        }
        component.$$.dirty[(i / 31) | 0] |= (1 << (i % 31));
    }
    function init(component, options, instance, create_fragment, not_equal, props, append_styles, dirty = [-1]) {
        const parent_component = current_component;
        set_current_component(component);
        const $$ = component.$$ = {
            fragment: null,
            ctx: null,
            // state
            props,
            update: noop,
            not_equal,
            bound: blank_object(),
            // lifecycle
            on_mount: [],
            on_destroy: [],
            on_disconnect: [],
            before_update: [],
            after_update: [],
            context: new Map(options.context || (parent_component ? parent_component.$$.context : [])),
            // everything else
            callbacks: blank_object(),
            dirty,
            skip_bound: false,
            root: options.target || parent_component.$$.root
        };
        append_styles && append_styles($$.root);
        let ready = false;
        $$.ctx = instance
            ? instance(component, options.props || {}, (i, ret, ...rest) => {
                const value = rest.length ? rest[0] : ret;
                if ($$.ctx && not_equal($$.ctx[i], $$.ctx[i] = value)) {
                    if (!$$.skip_bound && $$.bound[i])
                        $$.bound[i](value);
                    if (ready)
                        make_dirty(component, i);
                }
                return ret;
            })
            : [];
        $$.update();
        ready = true;
        run_all($$.before_update);
        // `false` as a special case of no DOM component
        $$.fragment = create_fragment ? create_fragment($$.ctx) : false;
        if (options.target) {
            if (options.hydrate) {
                const nodes = children(options.target);
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.l(nodes);
                nodes.forEach(detach);
            }
            else {
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.c();
            }
            if (options.intro)
                transition_in(component.$$.fragment);
            mount_component(component, options.target, options.anchor, options.customElement);
            flush();
        }
        set_current_component(parent_component);
    }
    /**
     * Base class for Svelte components. Used when dev=false.
     */
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
        $set($$props) {
            if (this.$$set && !is_empty($$props)) {
                this.$$.skip_bound = true;
                this.$$set($$props);
                this.$$.skip_bound = false;
            }
        }
    }

    function cubicOut(t) {
        const f = t - 1.0;
        return f * f * f + 1.0;
    }

    function fade(node, { delay = 0, duration = 400, easing = identity } = {}) {
        const o = +getComputedStyle(node).opacity;
        return {
            delay,
            duration,
            easing,
            css: t => `opacity: ${t * o}`
        };
    }
    function fly(node, { delay = 0, duration = 400, easing = cubicOut, x = 0, y = 0, opacity = 0 } = {}) {
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

    const gMapsDirection = 'https://www.google.com/maps/dir//';

    const states = [
    	'',
    	'Ny',
    	'Kontaktet',
    	'Mangler info',
    	'Klar til henting',
    	'Sendt til henter',
    	'Hentes',
    	'Hentet',
    	'Hentes ikke',
    	'Utsettes - neste gang',
    ];

    const doneStates = [
    	'Hentet',
    	'Hentes ikke',
    	'Utsettes - neste gang',
    	];

    const SIZE_BIG = 'Trenger varebil';
    const SIZE_MEDIUM = 'Kan hentes med stasjonsvogn';
    const SIZE_SMALL = '1-3 kasser';

    /* client/src/components/RenderDays.svelte generated by Svelte v3.49.0 */

    function add_css$c(target) {
    	append_styles(target, "svelte-urasfe", "ol.svelte-urasfe{list-style-type:none}li.svelte-urasfe{display:inline-block;height:20px;width:20px;color:grey;visibility:hidden;margin-left:8px}li.active.svelte-urasfe{color:black;visibility:visible}");
    }

    function get_each_context$9(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[2] = list[i];
    	return child_ctx;
    }

    // (26:0) {#each Object.keys(state) as day}
    function create_each_block$9(ctx) {
    	let li;
    	let t_value = /*day*/ ctx[2] + "";
    	let t;

    	return {
    		c() {
    			li = element("li");
    			t = text(t_value);
    			attr(li, "class", "svelte-urasfe");
    			toggle_class(li, "active", /*state*/ ctx[0][/*day*/ ctx[2]]);
    		},
    		m(target, anchor) {
    			insert(target, li, anchor);
    			append(li, t);
    		},
    		p(ctx, dirty) {
    			if (dirty & /*state*/ 1 && t_value !== (t_value = /*day*/ ctx[2] + "")) set_data(t, t_value);

    			if (dirty & /*state, Object*/ 1) {
    				toggle_class(li, "active", /*state*/ ctx[0][/*day*/ ctx[2]]);
    			}
    		},
    		d(detaching) {
    			if (detaching) detach(li);
    		}
    	};
    }

    function create_fragment$e(ctx) {
    	let ol;
    	let each_value = Object.keys(/*state*/ ctx[0]);
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block$9(get_each_context$9(ctx, each_value, i));
    	}

    	return {
    		c() {
    			ol = element("ol");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			attr(ol, "class", "svelte-urasfe");
    		},
    		m(target, anchor) {
    			insert(target, ol, anchor);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(ol, null);
    			}
    		},
    		p(ctx, [dirty]) {
    			if (dirty & /*state, Object*/ 1) {
    				each_value = Object.keys(/*state*/ ctx[0]);
    				let i;

    				for (i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context$9(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    					} else {
    						each_blocks[i] = create_each_block$9(child_ctx);
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
    		d(detaching) {
    			if (detaching) detach(ol);
    			destroy_each(each_blocks, detaching);
    		}
    	};
    }

    function instance$e($$self, $$props, $$invalidate) {
    	let { days } = $$props;

    	let state = {
    		/*Ma: false,*/ Ti: false,
    		On: false,
    		To: false
    	};

    	days.split(/, ?/g).forEach(day => {
    		$$invalidate(0, state[day.substr(0, 2)] = true, state);
    	});

    	$$self.$$set = $$props => {
    		if ('days' in $$props) $$invalidate(1, days = $$props.days);
    	};

    	return [state, days];
    }

    class RenderDays extends SvelteComponent {
    	constructor(options) {
    		super();
    		init(this, options, instance$e, create_fragment$e, safe_not_equal, { days: 1 }, add_css$c);
    	}
    }

    /* client/src/components/RenderTypes.svelte generated by Svelte v3.49.0 */

    function get_each_context$8(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[3] = list[i];
    	return child_ctx;
    }

    // (27:18) 
    function create_if_block_1$4(ctx) {
    	let br;
    	let t_value = /*typ*/ ctx[3] + "";
    	let t;

    	return {
    		c() {
    			br = element("br");
    			t = text(t_value);
    		},
    		m(target, anchor) {
    			insert(target, br, anchor);
    			insert(target, t, anchor);
    		},
    		p(ctx, dirty) {
    			if (dirty & /*types*/ 1 && t_value !== (t_value = /*typ*/ ctx[3] + "")) set_data(t, t_value);
    		},
    		d(detaching) {
    			if (detaching) detach(br);
    			if (detaching) detach(t);
    		}
    	};
    }

    // (25:0) {#if icons[typ]}
    function create_if_block$6(ctx) {
    	let img;
    	let img_src_value;
    	let img_alt_value;
    	let img_title_value;

    	return {
    		c() {
    			img = element("img");
    			if (!src_url_equal(img.src, img_src_value = /*icons*/ ctx[2][/*typ*/ ctx[3]])) attr(img, "src", img_src_value);
    			attr(img, "alt", img_alt_value = /*typ*/ ctx[3]);
    			attr(img, "title", img_title_value = /*typ*/ ctx[3]);
    			attr(img, "height", "24");
    		},
    		m(target, anchor) {
    			insert(target, img, anchor);
    		},
    		p(ctx, dirty) {
    			if (dirty & /*types*/ 1 && !src_url_equal(img.src, img_src_value = /*icons*/ ctx[2][/*typ*/ ctx[3]])) {
    				attr(img, "src", img_src_value);
    			}

    			if (dirty & /*types*/ 1 && img_alt_value !== (img_alt_value = /*typ*/ ctx[3])) {
    				attr(img, "alt", img_alt_value);
    			}

    			if (dirty & /*types*/ 1 && img_title_value !== (img_title_value = /*typ*/ ctx[3])) {
    				attr(img, "title", img_title_value);
    			}
    		},
    		d(detaching) {
    			if (detaching) detach(img);
    		}
    	};
    }

    // (24:0) {#each types as typ}
    function create_each_block$8(ctx) {
    	let if_block_anchor;

    	function select_block_type(ctx, dirty) {
    		if (/*icons*/ ctx[2][/*typ*/ ctx[3]]) return create_if_block$6;
    		if (/*showAll*/ ctx[1]) return create_if_block_1$4;
    	}

    	let current_block_type = select_block_type(ctx);
    	let if_block = current_block_type && current_block_type(ctx);

    	return {
    		c() {
    			if (if_block) if_block.c();
    			if_block_anchor = empty();
    		},
    		m(target, anchor) {
    			if (if_block) if_block.m(target, anchor);
    			insert(target, if_block_anchor, anchor);
    		},
    		p(ctx, dirty) {
    			if (current_block_type === (current_block_type = select_block_type(ctx)) && if_block) {
    				if_block.p(ctx, dirty);
    			} else {
    				if (if_block) if_block.d(1);
    				if_block = current_block_type && current_block_type(ctx);

    				if (if_block) {
    					if_block.c();
    					if_block.m(if_block_anchor.parentNode, if_block_anchor);
    				}
    			}
    		},
    		d(detaching) {
    			if (if_block) {
    				if_block.d(detaching);
    			}

    			if (detaching) detach(if_block_anchor);
    		}
    	};
    }

    function create_fragment$d(ctx) {
    	let each_1_anchor;
    	let each_value = /*types*/ ctx[0];
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block$8(get_each_context$8(ctx, each_value, i));
    	}

    	return {
    		c() {
    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			each_1_anchor = empty();
    		},
    		m(target, anchor) {
    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(target, anchor);
    			}

    			insert(target, each_1_anchor, anchor);
    		},
    		p(ctx, [dirty]) {
    			if (dirty & /*icons, types, showAll*/ 7) {
    				each_value = /*types*/ ctx[0];
    				let i;

    				for (i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context$8(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    					} else {
    						each_blocks[i] = create_each_block$8(child_ctx);
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
    		d(detaching) {
    			destroy_each(each_blocks, detaching);
    			if (detaching) detach(each_1_anchor);
    		}
    	};
    }

    function instance$d($$self, $$props, $$invalidate) {
    	let { types = [] } = $$props;
    	let { showAll = false } = $$props;

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
    			$$invalidate(0, types = types.split(/,\s+/g));
    		}
    	});

    	types = types.split(/,\s+/g);

    	$$self.$$set = $$props => {
    		if ('types' in $$props) $$invalidate(0, types = $$props.types);
    		if ('showAll' in $$props) $$invalidate(1, showAll = $$props.showAll);
    	};

    	return [types, showAll, icons];
    }

    class RenderTypes extends SvelteComponent {
    	constructor(options) {
    		super();
    		init(this, options, instance$d, create_fragment$d, safe_not_equal, { types: 0, showAll: 1 });
    	}
    }

    /* client/src/components/Modal.svelte generated by Svelte v3.49.0 */

    function add_css$b(target) {
    	append_styles(target, "svelte-txoeo", ".modal-background.svelte-txoeo{position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.3);z-index:11}.modal.svelte-txoeo{position:fixed;left:50%;top:50%;width:calc(100vw - 4em);max-width:32em;max-height:calc(100vh - 4em);overflow:auto;transform:translate(-50%,-50%);padding:1em;border-radius:0.2em;background:white;z-index:12}");
    }

    const get_header_slot_changes = dirty => ({});
    const get_header_slot_context = ctx => ({});

    function create_fragment$c(ctx) {
    	let div0;
    	let t0;
    	let div1;
    	let t1;
    	let hr0;
    	let t2;
    	let t3;
    	let hr1;
    	let current;
    	let mounted;
    	let dispose;
    	const header_slot_template = /*#slots*/ ctx[3].header;
    	const header_slot = create_slot(header_slot_template, ctx, /*$$scope*/ ctx[2], get_header_slot_context);
    	const default_slot_template = /*#slots*/ ctx[3].default;
    	const default_slot = create_slot(default_slot_template, ctx, /*$$scope*/ ctx[2], null);

    	return {
    		c() {
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
    			attr(div0, "class", "modal-background svelte-txoeo");
    			attr(div1, "class", "modal svelte-txoeo");
    		},
    		m(target, anchor) {
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
    			/*div1_binding*/ ctx[5](div1);
    			current = true;

    			if (!mounted) {
    				dispose = listen(div0, "click", stop_propagation(/*click_handler*/ ctx[4]));
    				mounted = true;
    			}
    		},
    		p(ctx, [dirty]) {
    			if (header_slot) {
    				if (header_slot.p && (!current || dirty & /*$$scope*/ 4)) {
    					update_slot_base(
    						header_slot,
    						header_slot_template,
    						ctx,
    						/*$$scope*/ ctx[2],
    						!current
    						? get_all_dirty_from_scope(/*$$scope*/ ctx[2])
    						: get_slot_changes(header_slot_template, /*$$scope*/ ctx[2], dirty, get_header_slot_changes),
    						get_header_slot_context
    					);
    				}
    			}

    			if (default_slot) {
    				if (default_slot.p && (!current || dirty & /*$$scope*/ 4)) {
    					update_slot_base(
    						default_slot,
    						default_slot_template,
    						ctx,
    						/*$$scope*/ ctx[2],
    						!current
    						? get_all_dirty_from_scope(/*$$scope*/ ctx[2])
    						: get_slot_changes(default_slot_template, /*$$scope*/ ctx[2], dirty, null),
    						null
    					);
    				}
    			}
    		},
    		i(local) {
    			if (current) return;
    			transition_in(header_slot, local);
    			transition_in(default_slot, local);
    			current = true;
    		},
    		o(local) {
    			transition_out(header_slot, local);
    			transition_out(default_slot, local);
    			current = false;
    		},
    		d(detaching) {
    			if (detaching) detach(div0);
    			if (detaching) detach(t0);
    			if (detaching) detach(div1);
    			if (header_slot) header_slot.d(detaching);
    			if (default_slot) default_slot.d(detaching);
    			/*div1_binding*/ ctx[5](null);
    			mounted = false;
    			dispose();
    		}
    	};
    }

    function instance$c($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	const dispatch = createEventDispatcher();
    	let modalElm;
    	let lastActiveElement;

    	onMount(() => {
    		if (modalElm && modalElm.scrollIntoView) {
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

    	const click_handler = () => dispatch("close");

    	function div1_binding($$value) {
    		binding_callbacks[$$value ? 'unshift' : 'push'](() => {
    			modalElm = $$value;
    			$$invalidate(0, modalElm);
    		});
    	}

    	$$self.$$set = $$props => {
    		if ('$$scope' in $$props) $$invalidate(2, $$scope = $$props.$$scope);
    	};

    	return [modalElm, dispatch, $$scope, slots, click_handler, div1_binding];
    }

    class Modal extends SvelteComponent {
    	constructor(options) {
    		super();
    		init(this, options, instance$c, create_fragment$c, safe_not_equal, {}, add_css$b);
    	}
    }

    /* client/src/components/DetailsEditor.svelte generated by Svelte v3.49.0 */

    function add_css$a(target) {
    	append_styles(target, "svelte-1hgccn9", "form.svelte-1hgccn9.svelte-1hgccn9{display:table;width:90%;margin-left:5%\n\t}p.svelte-1hgccn9.svelte-1hgccn9{display:table-row;width:100%;margin-top:8px}span.svelte-1hgccn9.svelte-1hgccn9{display:table-cell;vertical-align:top;padding-top:8px}span.svelte-1hgccn9.svelte-1hgccn9:first-child{width:30%}span.svelte-1hgccn9>input.svelte-1hgccn9,span.svelte-1hgccn9>textarea.svelte-1hgccn9,span.svelte-1hgccn9>select.svelte-1hgccn9{width:100%}span.svelte-1hgccn9 button.svelte-1hgccn9{width:40%}span.svelte-1hgccn9 button.svelte-1hgccn9:nth-child(2){margin-left:8px}textarea.svelte-1hgccn9.svelte-1hgccn9{height:100px}input.svelte-1hgccn9.svelte-1hgccn9,textarea.svelte-1hgccn9.svelte-1hgccn9,select.svelte-1hgccn9.svelte-1hgccn9{font-size:1em}span.svelte-1hgccn9 label.svelte-1hgccn9{display:block;width:45%;float:left}span.svelte-1hgccn9 label img.svelte-1hgccn9{vertical-align:bottom}");
    }

    function create_fragment$b(ctx) {
    	let form;
    	let p0;
    	let span0;
    	let span1;
    	let input0;
    	let t1;
    	let p1;
    	let span2;
    	let span3;
    	let textarea0;
    	let t3;
    	let p2;
    	let span4;
    	let span5;
    	let textarea1;
    	let t5;
    	let p3;
    	let span6;
    	let span7;
    	let select;
    	let option0;
    	let option1;
    	let option2;
    	let t10;
    	let p4;
    	let span8;
    	let t12;
    	let span9;
    	let label0;
    	let input1;
    	let t13;
    	let img0;
    	let img0_src_value;
    	let t14;
    	let label1;
    	let input2;
    	let t15;
    	let img1;
    	let img1_src_value;
    	let t16;
    	let label2;
    	let input3;
    	let t17;
    	let img2;
    	let img2_src_value;
    	let t18;
    	let p5;
    	let span10;
    	let t19;
    	let span11;
    	let button0;
    	let t21;
    	let button1;
    	let mounted;
    	let dispose;

    	return {
    		c() {
    			form = element("form");
    			p0 = element("p");
    			span0 = element("span");
    			span0.textContent = "Mobilnummer:";
    			span1 = element("span");
    			input0 = element("input");
    			t1 = space();
    			p1 = element("p");
    			span2 = element("span");
    			span2.textContent = "Adresse for henting:";
    			span3 = element("span");
    			textarea0 = element("textarea");
    			t3 = space();
    			p2 = element("p");
    			span4 = element("span");
    			span4.textContent = "Om loppene:";
    			span5 = element("span");
    			textarea1 = element("textarea");
    			t5 = space();
    			p3 = element("p");
    			span6 = element("span");
    			span6.textContent = "Hentetidspunkt:";
    			span7 = element("span");
    			select = element("select");
    			option0 = element("option");
    			option0.textContent = "Tirsdag kveld";
    			option1 = element("option");
    			option1.textContent = "Onsdag kveld";
    			option2 = element("option");
    			option2.textContent = "Torsdag kveld";
    			t10 = space();
    			p4 = element("p");
    			span8 = element("span");
    			span8.textContent = "Type bil:";
    			t12 = space();
    			span9 = element("span");
    			label0 = element("label");
    			input1 = element("input");
    			t13 = space();
    			img0 = element("img");
    			t14 = space();
    			label1 = element("label");
    			input2 = element("input");
    			t15 = space();
    			img1 = element("img");
    			t16 = space();
    			label2 = element("label");
    			input3 = element("input");
    			t17 = space();
    			img2 = element("img");
    			t18 = space();
    			p5 = element("p");
    			span10 = element("span");
    			t19 = space();
    			span11 = element("span");
    			button0 = element("button");
    			button0.textContent = "Oppdater";
    			t21 = space();
    			button1 = element("button");
    			button1.textContent = "Avbryt";
    			attr(span0, "class", "svelte-1hgccn9");
    			attr(input0, "inputmode", "tel");
    			attr(input0, "class", "svelte-1hgccn9");
    			attr(span1, "class", "svelte-1hgccn9");
    			attr(p0, "class", "svelte-1hgccn9");
    			attr(span2, "class", "svelte-1hgccn9");
    			attr(textarea0, "class", "svelte-1hgccn9");
    			attr(span3, "class", "svelte-1hgccn9");
    			attr(p1, "class", "svelte-1hgccn9");
    			attr(span4, "class", "svelte-1hgccn9");
    			attr(textarea1, "class", "svelte-1hgccn9");
    			attr(span5, "class", "svelte-1hgccn9");
    			attr(p2, "class", "svelte-1hgccn9");
    			attr(span6, "class", "svelte-1hgccn9");
    			option0.__value = "Tirsdag kveld";
    			option0.value = option0.__value;
    			option1.__value = "Onsdag kveld";
    			option1.value = option1.__value;
    			option2.__value = "Torsdag kveld";
    			option2.value = option2.__value;
    			select.multiple = true;
    			attr(select, "class", "svelte-1hgccn9");
    			if (/*time*/ ctx[2] === void 0) add_render_callback(() => /*select_change_handler*/ ctx[12].call(select));
    			attr(span7, "class", "svelte-1hgccn9");
    			attr(p3, "class", "svelte-1hgccn9");
    			attr(span8, "class", "svelte-1hgccn9");
    			attr(input1, "type", "radio");
    			attr(input1, "name", "size");
    			input1.__value = SIZE_BIG;
    			input1.value = input1.__value;
    			attr(input1, "class", "svelte-1hgccn9");
    			/*$$binding_groups*/ ctx[14][0].push(input1);
    			if (!src_url_equal(img0.src, img0_src_value = "/images/bigcar.png")) attr(img0, "src", img0_src_value);
    			attr(img0, "alt", "stor bil");
    			attr(img0, "width", "36");
    			attr(img0, "class", "svelte-1hgccn9");
    			attr(label0, "class", "svelte-1hgccn9");
    			attr(input2, "type", "radio");
    			attr(input2, "name", "size");
    			input2.__value = SIZE_MEDIUM;
    			input2.value = input2.__value;
    			attr(input2, "class", "svelte-1hgccn9");
    			/*$$binding_groups*/ ctx[14][0].push(input2);
    			if (!src_url_equal(img1.src, img1_src_value = "/images/smallcar.png")) attr(img1, "src", img1_src_value);
    			attr(img1, "alt", "liten bil");
    			attr(img1, "width", "36");
    			attr(img1, "class", "svelte-1hgccn9");
    			attr(label1, "class", "svelte-1hgccn9");
    			attr(input3, "type", "radio");
    			attr(input3, "name", "size");
    			input3.__value = SIZE_SMALL;
    			input3.value = input3.__value;
    			attr(input3, "class", "svelte-1hgccn9");
    			/*$$binding_groups*/ ctx[14][0].push(input3);
    			if (!src_url_equal(img2.src, img2_src_value = "/images/boxes.png")) attr(img2, "src", img2_src_value);
    			attr(img2, "alt", "liten bil");
    			attr(img2, "width", "36");
    			attr(img2, "class", "svelte-1hgccn9");
    			attr(label2, "class", "svelte-1hgccn9");
    			attr(span9, "class", "svelte-1hgccn9");
    			attr(p4, "class", "svelte-1hgccn9");
    			attr(span10, "class", "svelte-1hgccn9");
    			attr(button0, "type", "submit");
    			attr(button0, "class", "p8 br2 svelte-1hgccn9");
    			attr(button1, "type", "button");
    			attr(button1, "class", "p8 br2 svelte-1hgccn9");
    			attr(span11, "class", "svelte-1hgccn9");
    			attr(p5, "class", "svelte-1hgccn9");
    			attr(form, "class", "svelte-1hgccn9");
    		},
    		m(target, anchor) {
    			insert(target, form, anchor);
    			append(form, p0);
    			append(p0, span0);
    			append(p0, span1);
    			append(span1, input0);
    			set_input_value(input0, /*number*/ ctx[0]);
    			append(form, t1);
    			append(form, p1);
    			append(p1, span2);
    			append(p1, span3);
    			append(span3, textarea0);
    			set_input_value(textarea0, /*address*/ ctx[3]);
    			append(form, t3);
    			append(form, p2);
    			append(p2, span4);
    			append(p2, span5);
    			append(span5, textarea1);
    			set_input_value(textarea1, /*info*/ ctx[1]);
    			append(form, t5);
    			append(form, p3);
    			append(p3, span6);
    			append(p3, span7);
    			append(span7, select);
    			append(select, option0);
    			append(select, option1);
    			append(select, option2);
    			select_options(select, /*time*/ ctx[2]);
    			append(form, t10);
    			append(form, p4);
    			append(p4, span8);
    			append(p4, t12);
    			append(p4, span9);
    			append(span9, label0);
    			append(label0, input1);
    			input1.checked = input1.__value === /*size*/ ctx[4];
    			append(label0, t13);
    			append(label0, img0);
    			append(span9, t14);
    			append(span9, label1);
    			append(label1, input2);
    			input2.checked = input2.__value === /*size*/ ctx[4];
    			append(label1, t15);
    			append(label1, img1);
    			append(span9, t16);
    			append(span9, label2);
    			append(label2, input3);
    			input3.checked = input3.__value === /*size*/ ctx[4];
    			append(label2, t17);
    			append(label2, img2);
    			append(form, t18);
    			append(form, p5);
    			append(p5, span10);
    			append(p5, t19);
    			append(p5, span11);
    			append(span11, button0);
    			append(span11, t21);
    			append(span11, button1);

    			if (!mounted) {
    				dispose = [
    					listen(input0, "input", /*input0_input_handler*/ ctx[9]),
    					listen(textarea0, "input", /*textarea0_input_handler*/ ctx[10]),
    					listen(textarea1, "input", /*textarea1_input_handler*/ ctx[11]),
    					listen(select, "change", /*select_change_handler*/ ctx[12]),
    					listen(input1, "change", /*input1_change_handler*/ ctx[13]),
    					listen(input2, "change", /*input2_change_handler*/ ctx[15]),
    					listen(input3, "change", /*input3_change_handler*/ ctx[16]),
    					listen(button1, "click", /*click_handler*/ ctx[17]),
    					listen(form, "submit", prevent_default(/*submit_handler*/ ctx[18]))
    				];

    				mounted = true;
    			}
    		},
    		p(ctx, [dirty]) {
    			if (dirty & /*number*/ 1 && input0.value !== /*number*/ ctx[0]) {
    				set_input_value(input0, /*number*/ ctx[0]);
    			}

    			if (dirty & /*address*/ 8) {
    				set_input_value(textarea0, /*address*/ ctx[3]);
    			}

    			if (dirty & /*info*/ 2) {
    				set_input_value(textarea1, /*info*/ ctx[1]);
    			}

    			if (dirty & /*time*/ 4) {
    				select_options(select, /*time*/ ctx[2]);
    			}

    			if (dirty & /*size*/ 16) {
    				input1.checked = input1.__value === /*size*/ ctx[4];
    			}

    			if (dirty & /*size*/ 16) {
    				input2.checked = input2.__value === /*size*/ ctx[4];
    			}

    			if (dirty & /*size*/ 16) {
    				input3.checked = input3.__value === /*size*/ ctx[4];
    			}
    		},
    		i: noop,
    		o: noop,
    		d(detaching) {
    			if (detaching) detach(form);
    			/*$$binding_groups*/ ctx[14][0].splice(/*$$binding_groups*/ ctx[14][0].indexOf(input1), 1);
    			/*$$binding_groups*/ ctx[14][0].splice(/*$$binding_groups*/ ctx[14][0].indexOf(input2), 1);
    			/*$$binding_groups*/ ctx[14][0].splice(/*$$binding_groups*/ ctx[14][0].indexOf(input3), 1);
    			mounted = false;
    			run_all(dispose);
    		}
    	};
    }

    function instance$b($$self, $$props, $$invalidate) {
    	let { job } = $$props;
    	let { cols } = $$props;
    	const dispatch = createEventDispatcher();
    	let number = job[cols.PHONE];
    	let info = job[cols.DESC];
    	let time = job[cols.PICKUP_DAYS].split(/,\s*/g);
    	let address = job[cols.ADDRESS];
    	let size = job[cols.SIZE];

    	function update() {
    		dispatch('update', {
    			[cols.PHONE]: number,
    			[cols.ADDRESS]: address,
    			[cols.DESC]: info,
    			[cols.PICKUP_DAYS]: time.join(', '),
    			[cols.SIZE]: size
    		});
    	}

    	const $$binding_groups = [[]];

    	function input0_input_handler() {
    		number = this.value;
    		$$invalidate(0, number);
    	}

    	function textarea0_input_handler() {
    		address = this.value;
    		$$invalidate(3, address);
    	}

    	function textarea1_input_handler() {
    		info = this.value;
    		$$invalidate(1, info);
    	}

    	function select_change_handler() {
    		time = select_multiple_value(this);
    		$$invalidate(2, time);
    	}

    	function input1_change_handler() {
    		size = this.__value;
    		$$invalidate(4, size);
    	}

    	function input2_change_handler() {
    		size = this.__value;
    		$$invalidate(4, size);
    	}

    	function input3_change_handler() {
    		size = this.__value;
    		$$invalidate(4, size);
    	}

    	const click_handler = e => dispatch('cancel');
    	const submit_handler = e => update();

    	$$self.$$set = $$props => {
    		if ('job' in $$props) $$invalidate(7, job = $$props.job);
    		if ('cols' in $$props) $$invalidate(8, cols = $$props.cols);
    	};

    	return [
    		number,
    		info,
    		time,
    		address,
    		size,
    		dispatch,
    		update,
    		job,
    		cols,
    		input0_input_handler,
    		textarea0_input_handler,
    		textarea1_input_handler,
    		select_change_handler,
    		input1_change_handler,
    		$$binding_groups,
    		input2_change_handler,
    		input3_change_handler,
    		click_handler,
    		submit_handler
    	];
    }

    class DetailsEditor extends SvelteComponent {
    	constructor(options) {
    		super();
    		init(this, options, instance$b, create_fragment$b, safe_not_equal, { job: 7, cols: 8 }, add_css$a);
    	}
    }

    /* client/src/components/RenderPerson.svelte generated by Svelte v3.49.0 */

    function add_css$9(target) {
    	append_styles(target, "svelte-ablbnc", "a.svelte-ablbnc{display:inline-block;padding-right:1em}");
    }

    function create_fragment$a(ctx) {
    	let t0;
    	let t1;
    	let a0;
    	let t2;
    	let a0_href_value;
    	let t3;
    	let br;
    	let t4;
    	let t5;
    	let t6;
    	let a1;
    	let t7;
    	let a1_href_value;
    	let t8;
    	let a2;
    	let t9;
    	let a2_href_value;
    	let t10;
    	let a3;
    	let t11;
    	let a3_href_value;

    	return {
    		c() {
    			t0 = text(/*name*/ ctx[0]);
    			t1 = space();
    			a0 = element("a");
    			t2 = text("🔎");
    			t3 = space();
    			br = element("br");
    			t4 = space();
    			t5 = text(/*number*/ ctx[1]);
    			t6 = space();
    			a1 = element("a");
    			t7 = text("☎");
    			t8 = space();
    			a2 = element("a");
    			t9 = text("✉");
    			t10 = space();
    			a3 = element("a");
    			t11 = text("🔎");
    			attr(a0, "href", a0_href_value = "https://www.gulesider.no/" + encodeURIComponent(/*name*/ ctx[0]) + "/personer");
    			attr(a0, "target", "_blank");
    			attr(a0, "title", "Slå opp person på Gule sider");
    			attr(a0, "class", "svelte-ablbnc");
    			attr(a1, "href", a1_href_value = "tel:" + /*number*/ ctx[1]);
    			attr(a1, "title", "Ring nummer");
    			attr(a1, "class", "svelte-ablbnc");
    			attr(a2, "href", a2_href_value = "sms:" + /*number*/ ctx[1]);
    			attr(a2, "title", "Send SMS");
    			attr(a2, "class", "svelte-ablbnc");
    			attr(a3, "href", a3_href_value = "https://www.gulesider.no/" + /*number*/ ctx[1] + "/personer");
    			attr(a3, "target", "_blank");
    			attr(a3, "title", "slå opp nummer på Gule sider");
    			attr(a3, "class", "svelte-ablbnc");
    		},
    		m(target, anchor) {
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
    		p(ctx, [dirty]) {
    			if (dirty & /*name*/ 1) set_data(t0, /*name*/ ctx[0]);

    			if (dirty & /*name*/ 1 && a0_href_value !== (a0_href_value = "https://www.gulesider.no/" + encodeURIComponent(/*name*/ ctx[0]) + "/personer")) {
    				attr(a0, "href", a0_href_value);
    			}

    			if (dirty & /*number*/ 2) set_data(t5, /*number*/ ctx[1]);

    			if (dirty & /*number*/ 2 && a1_href_value !== (a1_href_value = "tel:" + /*number*/ ctx[1])) {
    				attr(a1, "href", a1_href_value);
    			}

    			if (dirty & /*number*/ 2 && a2_href_value !== (a2_href_value = "sms:" + /*number*/ ctx[1])) {
    				attr(a2, "href", a2_href_value);
    			}

    			if (dirty & /*number*/ 2 && a3_href_value !== (a3_href_value = "https://www.gulesider.no/" + /*number*/ ctx[1] + "/personer")) {
    				attr(a3, "href", a3_href_value);
    			}
    		},
    		i: noop,
    		o: noop,
    		d(detaching) {
    			if (detaching) detach(t0);
    			if (detaching) detach(t1);
    			if (detaching) detach(a0);
    			if (detaching) detach(t3);
    			if (detaching) detach(br);
    			if (detaching) detach(t4);
    			if (detaching) detach(t5);
    			if (detaching) detach(t6);
    			if (detaching) detach(a1);
    			if (detaching) detach(t8);
    			if (detaching) detach(a2);
    			if (detaching) detach(t10);
    			if (detaching) detach(a3);
    		}
    	};
    }

    function instance$a($$self, $$props, $$invalidate) {
    	let { name } = $$props;
    	let { number } = $$props;

    	$$self.$$set = $$props => {
    		if ('name' in $$props) $$invalidate(0, name = $$props.name);
    		if ('number' in $$props) $$invalidate(1, number = $$props.number);
    	};

    	return [name, number];
    }

    class RenderPerson extends SvelteComponent {
    	constructor(options) {
    		super();
    		init(this, options, instance$a, create_fragment$a, safe_not_equal, { name: 0, number: 1 }, add_css$9);
    	}
    }

    /* client/src/components/RenderStars.svelte generated by Svelte v3.49.0 */

    function add_css$8(target) {
    	append_styles(target, "svelte-ssp047", "img.svelte-ssp047{width:16px;height:16px;transition:all .2s ease-in-out}img.svelte-ssp047:hover{transform:scale(1.1)}");
    }

    function get_each_context$7(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[5] = list[i];
    	child_ctx[7] = i;
    	return child_ctx;
    }

    // (42:0) {#each stars as star, index}
    function create_each_block$7(ctx) {
    	let img;
    	let img_src_value;
    	let img_alt_value;
    	let mounted;
    	let dispose;

    	return {
    		c() {
    			img = element("img");
    			if (!src_url_equal(img.src, img_src_value = /*star*/ ctx[5])) attr(img, "src", img_src_value);
    			attr(img, "alt", img_alt_value = "poeng: " + /*qualityRanking*/ ctx[0]);
    			attr(img, "data-index", /*index*/ ctx[7]);
    			attr(img, "class", "svelte-ssp047");
    		},
    		m(target, anchor) {
    			insert(target, img, anchor);

    			if (!mounted) {
    				dispose = listen(img, "click", /*handleClick*/ ctx[2]);
    				mounted = true;
    			}
    		},
    		p(ctx, dirty) {
    			if (dirty & /*stars*/ 2 && !src_url_equal(img.src, img_src_value = /*star*/ ctx[5])) {
    				attr(img, "src", img_src_value);
    			}

    			if (dirty & /*qualityRanking*/ 1 && img_alt_value !== (img_alt_value = "poeng: " + /*qualityRanking*/ ctx[0])) {
    				attr(img, "alt", img_alt_value);
    			}
    		},
    		d(detaching) {
    			if (detaching) detach(img);
    			mounted = false;
    			dispose();
    		}
    	};
    }

    function create_fragment$9(ctx) {
    	let div;
    	let each_value = /*stars*/ ctx[1];
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block$7(get_each_context$7(ctx, each_value, i));
    	}

    	return {
    		c() {
    			div = element("div");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}
    		},
    		m(target, anchor) {
    			insert(target, div, anchor);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(div, null);
    			}
    		},
    		p(ctx, [dirty]) {
    			if (dirty & /*stars, qualityRanking, handleClick*/ 7) {
    				each_value = /*stars*/ ctx[1];
    				let i;

    				for (i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context$7(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
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
    		},
    		i: noop,
    		o: noop,
    		d(detaching) {
    			if (detaching) detach(div);
    			destroy_each(each_blocks, detaching);
    		}
    	};
    }

    let img1 = '/images/star-empty.png';
    let img2 = '/images/star-full.png';

    function instance$9($$self, $$props, $$invalidate) {
    	const dispatch = createEventDispatcher();
    	let { qualityRanking = undefined } = $$props;
    	let { cols } = $$props;
    	let stars = [];

    	if (qualityRanking === '' || qualityRanking === undefined) {
    		stars = [img1, img1, img1];
    	} else {
    		for (let i = 0; i <= qualityRanking; i++) {
    			stars.push(img2);
    		}

    		for (let i = qualityRanking; i < 2; i++) {
    			stars.push(img1);
    		}
    	}

    	function handleClick(evt) {
    		let idx = parseInt(evt.target.getAttribute('data-index'));
    		$$invalidate(0, qualityRanking = idx + 1);
    		dispatch('qualityupdate', { [cols.QUALITY]: idx });

    		for (let i = 0; i <= idx; i++) {
    			$$invalidate(1, stars[i] = img2, stars);
    		}

    		for (let i = idx + 1; i < stars.length; i++) {
    			$$invalidate(1, stars[i] = img1, stars);
    		}
    	}

    	$$self.$$set = $$props => {
    		if ('qualityRanking' in $$props) $$invalidate(0, qualityRanking = $$props.qualityRanking);
    		if ('cols' in $$props) $$invalidate(3, cols = $$props.cols);
    	};

    	return [qualityRanking, stars, handleClick, cols];
    }

    class RenderStars extends SvelteComponent {
    	constructor(options) {
    		super();
    		init(this, options, instance$9, create_fragment$9, safe_not_equal, { qualityRanking: 0, cols: 3 }, add_css$8);
    	}
    }

    /* client/src/components/LoadingIcon.svelte generated by Svelte v3.49.0 */

    function add_css$7(target) {
    	append_styles(target, "svelte-1sriuqy", ".lds-dual-ring.svelte-1sriuqy{display:inline-block}.lds-dual-ring.svelte-1sriuqy:after{content:\" \";display:block;width:26px;height:26px;margin:1px;border-radius:50%;border:5px solid #000;border-color:#000 transparent #000 transparent;animation:svelte-1sriuqy-lds-dual-ring 1.2s linear infinite}@keyframes svelte-1sriuqy-lds-dual-ring{0%{transform:rotate(0deg)}100%{transform:rotate(360deg)}}");
    }

    function create_fragment$8(ctx) {
    	let div;

    	return {
    		c() {
    			div = element("div");
    			attr(div, "class", "lds-dual-ring svelte-1sriuqy");
    			set_style(div, "width", /*w*/ ctx[0] + "px");
    			set_style(div, "height", /*h*/ ctx[1] + "px");
    		},
    		m(target, anchor) {
    			insert(target, div, anchor);
    		},
    		p(ctx, [dirty]) {
    			if (dirty & /*w*/ 1) {
    				set_style(div, "width", /*w*/ ctx[0] + "px");
    			}

    			if (dirty & /*h*/ 2) {
    				set_style(div, "height", /*h*/ ctx[1] + "px");
    			}
    		},
    		i: noop,
    		o: noop,
    		d(detaching) {
    			if (detaching) detach(div);
    		}
    	};
    }

    function instance$8($$self, $$props, $$invalidate) {
    	let { w = 32 } = $$props;
    	let { h = 32 } = $$props;

    	$$self.$$set = $$props => {
    		if ('w' in $$props) $$invalidate(0, w = $$props.w);
    		if ('h' in $$props) $$invalidate(1, h = $$props.h);
    	};

    	return [w, h];
    }

    class LoadingIcon extends SvelteComponent {
    	constructor(options) {
    		super();
    		init(this, options, instance$8, create_fragment$8, safe_not_equal, { w: 0, h: 1 }, add_css$7);
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
        const subscribers = new Set();
        function set(new_value) {
            if (safe_not_equal(value, new_value)) {
                value = new_value;
                if (stop) { // store is ready
                    const run_queue = !subscriber_queue.length;
                    for (const subscriber of subscribers) {
                        subscriber[1]();
                        subscriber_queue.push(subscriber, value);
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
            subscribers.add(subscriber);
            if (subscribers.size === 1) {
                stop = start(set) || noop;
            }
            run(value);
            return () => {
                subscribers.delete(subscriber);
                if (subscribers.size === 0) {
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
    	drivers.subscribe(data => {
    		localStorage.setItem('drivers', JSON.stringify(data));
    	});
    }

    const FROM = '4741238002';

    function changeJobDetails(jobnr, cols, newState, token) {
    	jobs.update(jobs => {
    		let theJob = jobs.find(job => job[cols.JOBNR] === jobnr);
    		// TODO: job used to be object, is now array. This hack should fail..?
    		// weirdly it works.. The flexibility of JS and Svelte is amazing
    		theJob.loading = true;
    		for (let prop in newState) {
    			theJob[prop] = newState[prop];
    		}
    		return jobs;
    	});
    	let url = apiUrl + '/update/' + jobnr;
    	if (token) {
    		url += '?token=' + token;
    	}
    	return fetch(url , {
    		method: 'post',
    		headers: {'Content-type': 'application/json'},
    		body: JSON.stringify({details:  newState}),
    	})
    	.then(response => response.json())
    	.then(data => {
    		console.log(data);
    		jobs.update(jobs => {
    			let theJob = jobs.find(job => job[cols.JOBNR] === jobnr);
    			theJob.loading = false;
    			return jobs;
    		});
    		return data;
    	})
    	.catch(error => {
    		if (confirm('Beklager, kunne ikke oppdatere hentejobben.' +
    			'Sannsynligvis vil det fungere om vi laster sida på nytt, ' +
    			'men endringer du prøvde å lagre nå må du gjøre på nytt. ' +
    			'Klikk OK for å laste på nytt.')) {
    			location.reload();
    		}
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
    	return url
    		.split(/\//g)
    		.splice(-2)
    		.join("/");
    }

    // SMSapi uses the national 47 prefix but w/o +, we typically want to
    // strip that out. I remove whitespace just in case we use this method
    // on input form non-SMSapi sources..
    function normalizeNumber(str) {
    	return str.replace(/\s*/g, "").substr(-8);
    }

    function filter(
    	string,
    	sizePref,
    	dayPref,
    	typeFilter,
    	qualityFilter,
    	hideDoneJobs,
    	fetchers,
    	job,
    	cols
    ) {
    	if (hideDoneJobs && doneStates.indexOf(job[cols.STATUS]) > -1) {
    		return false;
    	}
    	// all the "defaults" set - noop
    	if (
    		sizePref.smallActive &&
    		sizePref.mediumActive &&
    		sizePref.bigActive &&
    		dayPref.monActive &&
    		dayPref.tueActive &&
    		dayPref.wedActive &&
    		dayPref.thuActive &&
    		!dayPref.dayFilterExclusive &&
    		!string &&
    		!typeFilter &&
    		qualityFilter === ''
    	) {
    		return true;
    	}

    	if (job[cols.SIZE] === SIZE_BIG && !sizePref.bigActive) {
    		return false;
    	}
    	if (job[cols.SIZE] === SIZE_MEDIUM && !sizePref.mediumActive) {
    		return false;
    	}

    	if (job[cols.SIZE] === SIZE_SMALL && !sizePref.smallActive) {
    		return false;
    	}

    	if (typeFilter && job[cols.TYPES].indexOf(typeFilter) === -1) {
    		return false;
    	}

    	if (qualityFilter !== '' && job[cols.QUALITY] !== qualityFilter) {
    		return false;
    	}

    	let showDay = [
    		//{prop: dayPref.monActive, str: 'Mandag'},
    		{ prop: dayPref.tueActive, str: "Tirsdag" },
    		{ prop: dayPref.wedActive, str: "Onsdag" },
    		{ prop: dayPref.thuActive, str: "Torsdag" },
    	].map((item) => {
    		if (dayPref.dayFilterExclusive) {
    			return (
    				job[cols.PICKUP_DAYS].indexOf(item.str) >
    					-1 ===
    				item.prop
    			);
    		}
    		return (
    			item.prop &&
    			job[cols.PICKUP_DAYS].indexOf(item.str) > -1
    		);
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
    	if (job[cols.ASSIGNEE] && fetchers && fetchers.length && string) {
    		if (
    			fetchers.find(
    				(person) =>
    					person.name.toLowerCase().indexOf(string.toLowerCase()) > -1
    			)
    		) {
    			return true;
    		}
    	}

    	return (
    		[
    			cols.ADDRESS,
    			cols.TYPES,
    			cols.CONTACT_PERSON,
    			cols.PHONE,
    			cols.DESC,
    			cols.AREA,
    			cols.STATUS,
    			cols.ADMCOMMENT,
    			cols.ASSIGNEE,
    		]
    			.map((key) => {
    				return (
    					(job[key] || "")
    						.toLowerCase()
    						.indexOf(string.toLowerCase()) > -1
    				);
    			})
    			.indexOf(true) > -1
    	);
    }

    /* client/src/components/RenderJob.svelte generated by Svelte v3.49.0 */

    function add_css$6(target) {
    	append_styles(target, "svelte-9gtksp", ".job.svelte-9gtksp.svelte-9gtksp{margin-bottom:8px;border-top:1px solid grey;border-collapse:collapse}.job.svelte-9gtksp.svelte-9gtksp:hover{background:#eee}td.svelte-9gtksp.svelte-9gtksp{padding-left:16px;padding-right:16px;vertical-align:top}.job.svelte-9gtksp td.svelte-9gtksp:first-child{cursor:pointer;overflow:hidden;text-overflow:ellipsis}.extrainfo.svelte-9gtksp.svelte-9gtksp{border-bottom:1px solid grey}tr.itemSelected.svelte-9gtksp.svelte-9gtksp{font-weight:bold}.statuscell.svelte-9gtksp.svelte-9gtksp{position:relative;cursor:pointer}.cen.svelte-9gtksp.svelte-9gtksp{text-align:center}label.svelte-9gtksp.svelte-9gtksp{cursor:pointer}input[type=\"checkbox\"].svelte-9gtksp.svelte-9gtksp{display:none}input[type=\"checkbox\"].svelte-9gtksp+label.svelte-9gtksp{float:right}input[type=\"checkbox\"].svelte-9gtksp:not(:checked)+label.svelte-9gtksp{color:grey}input[type=\"checkbox\"].svelte-9gtksp:checked+label.svelte-9gtksp{color:black}input[type=\"checkbox\"].svelte-9gtksp:checked+label.svelte-9gtksp:after{content:\" \";display:block;width:0;height:0;border-top:30px solid transparent;border-right:30px solid black;transform:rotate(-90deg);position:absolute;top:0;right:0}select.svelte-9gtksp.svelte-9gtksp{max-width:65%;float:left}.smallscreen.svelte-9gtksp.svelte-9gtksp{display:none}@media only screen and (max-width: 600px){td.svelte-9gtksp.svelte-9gtksp:nth-child(3){display:none}td.svelte-9gtksp.svelte-9gtksp:nth-child(4){display:none}td.svelte-9gtksp.svelte-9gtksp:nth-child(5){display:none}.smallscreen.svelte-9gtksp.svelte-9gtksp{display:block}}@media only screen and (max-width: 700px){td.svelte-9gtksp.svelte-9gtksp:nth-child(3){display:none}}button.svelte-9gtksp img.svelte-9gtksp{vertical-align:middle}.loading.svelte-9gtksp.svelte-9gtksp{position:relative}.loading.svelte-9gtksp div.svelte-9gtksp{position:absolute;right:16px;top:8px;z-index:10}.hentesav.svelte-9gtksp.svelte-9gtksp{font-size:x-small;max-width:65%;clear:left}textarea.svelte-9gtksp.svelte-9gtksp{height:150px;width:100%;font-size:1em}.jobnr.svelte-9gtksp.svelte-9gtksp{padding:4px;background:#aaa;margin-left:-14px}small.area.svelte-9gtksp.svelte-9gtksp{font-size:x-small;text-transform:capitalize}");
    }

    function get_each_context$6(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[23] = list[i];
    	return child_ctx;
    }

    // (145:0) {#if itemData.loading}
    function create_if_block_5$1(ctx) {
    	let div;
    	let loadingicon;
    	let current;
    	loadingicon = new LoadingIcon({ props: { w: "24", h: "24" } });

    	return {
    		c() {
    			div = element("div");
    			create_component(loadingicon.$$.fragment);
    			attr(div, "class", "svelte-9gtksp");
    		},
    		m(target, anchor) {
    			insert(target, div, anchor);
    			mount_component(loadingicon, div, null);
    			current = true;
    		},
    		i(local) {
    			if (current) return;
    			transition_in(loadingicon.$$.fragment, local);
    			current = true;
    		},
    		o(local) {
    			transition_out(loadingicon.$$.fragment, local);
    			current = false;
    		},
    		d(detaching) {
    			if (detaching) detach(div);
    			destroy_component(loadingicon);
    		}
    	};
    }

    // (161:0) {:else}
    function create_else_block$2(ctx) {
    	let img;
    	let img_src_value;

    	return {
    		c() {
    			img = element("img");
    			if (!src_url_equal(img.src, img_src_value = "/images/boxes.png")) attr(img, "src", img_src_value);
    			attr(img, "alt", "1-3 bokser");
    			attr(img, "height", "22");
    		},
    		m(target, anchor) {
    			insert(target, img, anchor);
    		},
    		d(detaching) {
    			if (detaching) detach(img);
    		}
    	};
    }

    // (159:46) 
    function create_if_block_4$1(ctx) {
    	let img;
    	let img_src_value;

    	return {
    		c() {
    			img = element("img");
    			if (!src_url_equal(img.src, img_src_value = "/images/smallcar.png")) attr(img, "src", img_src_value);
    			attr(img, "alt", "stasjonsvogn");
    			attr(img, "height", "22");
    		},
    		m(target, anchor) {
    			insert(target, img, anchor);
    		},
    		d(detaching) {
    			if (detaching) detach(img);
    		}
    	};
    }

    // (157:0) {#if itemData[cols.SIZE] === SIZE_BIG}
    function create_if_block_3$2(ctx) {
    	let img;
    	let img_src_value;

    	return {
    		c() {
    			img = element("img");
    			if (!src_url_equal(img.src, img_src_value = "/images/bigcar.png")) attr(img, "src", img_src_value);
    			attr(img, "alt", "varebil");
    			attr(img, "height", "22");
    		},
    		m(target, anchor) {
    			insert(target, img, anchor);
    		},
    		d(detaching) {
    			if (detaching) detach(img);
    		}
    	};
    }

    // (182:1) {#each states as theState}
    function create_each_block$6(ctx) {
    	let option;
    	let t_value = /*theState*/ ctx[23] + "";
    	let t;

    	return {
    		c() {
    			option = element("option");
    			t = text(t_value);
    			option.__value = /*theState*/ ctx[23];
    			option.value = option.__value;
    		},
    		m(target, anchor) {
    			insert(target, option, anchor);
    			append(option, t);
    		},
    		p: noop,
    		d(detaching) {
    			if (detaching) detach(option);
    		}
    	};
    }

    // (186:0) {#if itemData[cols.ASSIGNEE]}
    function create_if_block_2$3(ctx) {
    	let div;
    	let a;
    	let t0_value = /*getDriverName*/ ctx[8](/*itemData*/ ctx[0][/*cols*/ ctx[6].ASSIGNEE]) + "";
    	let t0;
    	let a_href_value;
    	let t1;
    	let t2_value = statusVerbString(/*itemData*/ ctx[0][/*cols*/ ctx[6].STATUS]) + "";
    	let t2;

    	return {
    		c() {
    			div = element("div");
    			a = element("a");
    			t0 = text(t0_value);
    			t1 = space();
    			t2 = text(t2_value);
    			attr(a, "href", a_href_value = "tel:" + normalizeNumber(/*itemData*/ ctx[0][/*cols*/ ctx[6].ASSIGNEE]));
    			attr(div, "class", "hentesav svelte-9gtksp");
    		},
    		m(target, anchor) {
    			insert(target, div, anchor);
    			append(div, a);
    			append(a, t0);
    			append(div, t1);
    			append(div, t2);
    		},
    		p(ctx, dirty) {
    			if (dirty & /*itemData*/ 1 && t0_value !== (t0_value = /*getDriverName*/ ctx[8](/*itemData*/ ctx[0][/*cols*/ ctx[6].ASSIGNEE]) + "")) set_data(t0, t0_value);

    			if (dirty & /*itemData, states*/ 1 && a_href_value !== (a_href_value = "tel:" + normalizeNumber(/*itemData*/ ctx[0][/*cols*/ ctx[6].ASSIGNEE]))) {
    				attr(a, "href", a_href_value);
    			}

    			if (dirty & /*itemData*/ 1 && t2_value !== (t2_value = statusVerbString(/*itemData*/ ctx[0][/*cols*/ ctx[6].STATUS]) + "")) set_data(t2, t2_value);
    		},
    		d(detaching) {
    			if (detaching) detach(div);
    		}
    	};
    }

    // (193:0) {#if expanded}
    function create_if_block$5(ctx) {
    	let tr;
    	let td0;
    	let td1;
    	let renderperson;
    	let t0;
    	let p0;
    	let t1_value = /*itemData*/ ctx[0][/*cols*/ ctx[6].TYPES] + "";
    	let t1;
    	let t2;
    	let p1;
    	let i;
    	let t3_value = /*itemData*/ ctx[0][/*cols*/ ctx[6].DESC] + "";
    	let t3;
    	let t4;
    	let p2;
    	let button;
    	let t5;
    	let t6;
    	let td2;
    	let t7;
    	let br;
    	let t8;
    	let textarea;
    	let tr_data_id_value;
    	let current;
    	let mounted;
    	let dispose;

    	renderperson = new RenderPerson({
    			props: {
    				name: /*itemData*/ ctx[0][/*cols*/ ctx[6].CONTACT_PERSON],
    				number: /*itemData*/ ctx[0][/*cols*/ ctx[6].PHONE]
    			}
    		});

    	let if_block = /*showEditor*/ ctx[3] && create_if_block_1$3(ctx);

    	return {
    		c() {
    			tr = element("tr");
    			td0 = element("td");
    			td1 = element("td");
    			create_component(renderperson.$$.fragment);
    			t0 = space();
    			p0 = element("p");
    			t1 = text(t1_value);
    			t2 = space();
    			p1 = element("p");
    			i = element("i");
    			t3 = text(t3_value);
    			t4 = space();
    			p2 = element("p");
    			button = element("button");
    			button.innerHTML = `<img src="/images/edit.png" alt="endre detaljer" width="36" class="svelte-9gtksp"/>`;
    			t5 = space();
    			if (if_block) if_block.c();
    			t6 = space();
    			td2 = element("td");
    			t7 = text("Kommentarer fra admin/hentere:");
    			br = element("br");
    			t8 = space();
    			textarea = element("textarea");
    			attr(td0, "class", "svelte-9gtksp");
    			attr(button, "class", "svelte-9gtksp");
    			attr(p2, "class", "cen svelte-9gtksp");
    			attr(td1, "colspan", "3");
    			attr(td1, "class", "extrainfo svelte-9gtksp");
    			attr(textarea, "class", "svelte-9gtksp");
    			attr(td2, "colspan", "2");
    			attr(td2, "class", "svelte-9gtksp");
    			attr(tr, "data-id", tr_data_id_value = /*itemData*/ ctx[0][/*cols*/ ctx[6].JOBNR]);
    		},
    		m(target, anchor) {
    			insert(target, tr, anchor);
    			append(tr, td0);
    			append(tr, td1);
    			mount_component(renderperson, td1, null);
    			append(td1, t0);
    			append(td1, p0);
    			append(p0, t1);
    			append(td1, t2);
    			append(td1, p1);
    			append(p1, i);
    			append(i, t3);
    			append(td1, t4);
    			append(td1, p2);
    			append(p2, button);
    			append(td1, t5);
    			if (if_block) if_block.m(td1, null);
    			append(tr, t6);
    			append(tr, td2);
    			append(td2, t7);
    			append(td2, br);
    			append(td2, t8);
    			append(td2, textarea);
    			set_input_value(textarea, /*itemData*/ ctx[0][/*cols*/ ctx[6].ADMCOMMENT]);
    			current = true;

    			if (!mounted) {
    				dispose = [
    					listen(button, "click", /*click_handler_3*/ ctx[17]),
    					listen(textarea, "input", /*textarea_input_handler*/ ctx[20]),
    					listen(textarea, "change", /*change_handler_2*/ ctx[21])
    				];

    				mounted = true;
    			}
    		},
    		p(ctx, dirty) {
    			const renderperson_changes = {};
    			if (dirty & /*itemData*/ 1) renderperson_changes.name = /*itemData*/ ctx[0][/*cols*/ ctx[6].CONTACT_PERSON];
    			if (dirty & /*itemData*/ 1) renderperson_changes.number = /*itemData*/ ctx[0][/*cols*/ ctx[6].PHONE];
    			renderperson.$set(renderperson_changes);
    			if ((!current || dirty & /*itemData*/ 1) && t1_value !== (t1_value = /*itemData*/ ctx[0][/*cols*/ ctx[6].TYPES] + "")) set_data(t1, t1_value);
    			if ((!current || dirty & /*itemData*/ 1) && t3_value !== (t3_value = /*itemData*/ ctx[0][/*cols*/ ctx[6].DESC] + "")) set_data(t3, t3_value);

    			if (/*showEditor*/ ctx[3]) {
    				if (if_block) {
    					if_block.p(ctx, dirty);

    					if (dirty & /*showEditor*/ 8) {
    						transition_in(if_block, 1);
    					}
    				} else {
    					if_block = create_if_block_1$3(ctx);
    					if_block.c();
    					transition_in(if_block, 1);
    					if_block.m(td1, null);
    				}
    			} else if (if_block) {
    				group_outros();

    				transition_out(if_block, 1, 1, () => {
    					if_block = null;
    				});

    				check_outros();
    			}

    			if (dirty & /*itemData, cols, states*/ 65) {
    				set_input_value(textarea, /*itemData*/ ctx[0][/*cols*/ ctx[6].ADMCOMMENT]);
    			}

    			if (!current || dirty & /*itemData, states*/ 1 && tr_data_id_value !== (tr_data_id_value = /*itemData*/ ctx[0][/*cols*/ ctx[6].JOBNR])) {
    				attr(tr, "data-id", tr_data_id_value);
    			}
    		},
    		i(local) {
    			if (current) return;
    			transition_in(renderperson.$$.fragment, local);
    			transition_in(if_block);
    			current = true;
    		},
    		o(local) {
    			transition_out(renderperson.$$.fragment, local);
    			transition_out(if_block);
    			current = false;
    		},
    		d(detaching) {
    			if (detaching) detach(tr);
    			destroy_component(renderperson);
    			if (if_block) if_block.d();
    			mounted = false;
    			run_all(dispose);
    		}
    	};
    }

    // (200:1) {#if showEditor}
    function create_if_block_1$3(ctx) {
    	let modal;
    	let current;

    	modal = new Modal({
    			props: {
    				$$slots: {
    					header: [create_header_slot$1],
    					default: [create_default_slot$1]
    				},
    				$$scope: { ctx }
    			}
    		});

    	modal.$on("close", /*close_handler*/ ctx[19]);

    	return {
    		c() {
    			create_component(modal.$$.fragment);
    		},
    		m(target, anchor) {
    			mount_component(modal, target, anchor);
    			current = true;
    		},
    		p(ctx, dirty) {
    			const modal_changes = {};

    			if (dirty & /*$$scope, itemData, showEditor*/ 67108873) {
    				modal_changes.$$scope = { dirty, ctx };
    			}

    			modal.$set(modal_changes);
    		},
    		i(local) {
    			if (current) return;
    			transition_in(modal.$$.fragment, local);
    			current = true;
    		},
    		o(local) {
    			transition_out(modal.$$.fragment, local);
    			current = false;
    		},
    		d(detaching) {
    			destroy_component(modal, detaching);
    		}
    	};
    }

    // (201:2) <Modal on:close="{() => showEditor = false}" >
    function create_default_slot$1(ctx) {
    	let detailseditor;
    	let current;

    	detailseditor = new DetailsEditor({
    			props: {
    				job: /*itemData*/ ctx[0],
    				cols: /*cols*/ ctx[6]
    			}
    		});

    	detailseditor.$on("update", /*update*/ ctx[7]);
    	detailseditor.$on("cancel", /*cancel_handler*/ ctx[18]);

    	return {
    		c() {
    			create_component(detailseditor.$$.fragment);
    		},
    		m(target, anchor) {
    			mount_component(detailseditor, target, anchor);
    			current = true;
    		},
    		p(ctx, dirty) {
    			const detailseditor_changes = {};
    			if (dirty & /*itemData*/ 1) detailseditor_changes.job = /*itemData*/ ctx[0];
    			detailseditor.$set(detailseditor_changes);
    		},
    		i(local) {
    			if (current) return;
    			transition_in(detailseditor.$$.fragment, local);
    			current = true;
    		},
    		o(local) {
    			transition_out(detailseditor.$$.fragment, local);
    			current = false;
    		},
    		d(detaching) {
    			destroy_component(detailseditor, detaching);
    		}
    	};
    }

    // (202:3) 
    function create_header_slot$1(ctx) {
    	let h2;

    	return {
    		c() {
    			h2 = element("h2");
    			h2.textContent = "Endre detaljer";
    			attr(h2, "slot", "header");
    		},
    		m(target, anchor) {
    			insert(target, h2, anchor);
    		},
    		p: noop,
    		d(detaching) {
    			if (detaching) detach(h2);
    		}
    	};
    }

    function create_fragment$7(ctx) {
    	let tr;
    	let td0;
    	let t0_value = /*itemData*/ ctx[0][/*cols*/ ctx[6].JOBNR] + "";
    	let t0;
    	let t1;
    	let td1;
    	let t2;
    	let t3_value = /*itemData*/ ctx[0][/*cols*/ ctx[6].ADDRESS] + "";
    	let t3;
    	let t4;
    	let a;
    	let t5;
    	let a_href_value;
    	let t6;
    	let br0;
    	let small;
    	let t7_value = /*itemData*/ ctx[0][/*cols*/ ctx[6].AREA] + "";
    	let t7;
    	let t8;
    	let br1;
    	let t9;
    	let div;
    	let i;
    	let t10_value = /*itemData*/ ctx[0][/*cols*/ ctx[6].PICKUP_DAYS] + "";
    	let t10;
    	let t11;
    	let td2;
    	let t12;
    	let td3;
    	let rendertypes;
    	let t13;
    	let td4;
    	let renderstars;
    	let t14;
    	let td5;
    	let renderdays;
    	let t15;
    	let td6;
    	let input;
    	let input_id_value;
    	let t16;
    	let label;
    	let t17;
    	let label_for_value;
    	let t18;
    	let select;
    	let select_disabled_value;
    	let t19;
    	let tr_data_id_value;
    	let t20;
    	let if_block3_anchor;
    	let current;
    	let mounted;
    	let dispose;
    	let if_block0 = /*itemData*/ ctx[0].loading && create_if_block_5$1();

    	function select_block_type(ctx, dirty) {
    		if (/*itemData*/ ctx[0][/*cols*/ ctx[6].SIZE] === SIZE_BIG) return create_if_block_3$2;
    		if (/*itemData*/ ctx[0][/*cols*/ ctx[6].SIZE] === SIZE_MEDIUM) return create_if_block_4$1;
    		return create_else_block$2;
    	}

    	let current_block_type = select_block_type(ctx);
    	let if_block1 = current_block_type(ctx);

    	rendertypes = new RenderTypes({
    			props: {
    				types: /*itemData*/ ctx[0][/*cols*/ ctx[6].TYPES]
    			}
    		});

    	renderstars = new RenderStars({
    			props: {
    				cols: /*cols*/ ctx[6],
    				qualityRanking: /*itemData*/ ctx[0][/*cols*/ ctx[6].QUALITY]
    			}
    		});

    	renderstars.$on("qualityupdate", /*update*/ ctx[7]);

    	renderdays = new RenderDays({
    			props: {
    				days: /*itemData*/ ctx[0][/*cols*/ ctx[6].PICKUP_DAYS]
    			}
    		});

    	let each_value = states;
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block$6(get_each_context$6(ctx, each_value, i));
    	}

    	let if_block2 = /*itemData*/ ctx[0][/*cols*/ ctx[6].ASSIGNEE] && create_if_block_2$3(ctx);
    	let if_block3 = /*expanded*/ ctx[2] && create_if_block$5(ctx);

    	return {
    		c() {
    			tr = element("tr");
    			td0 = element("td");
    			t0 = text(t0_value);
    			t1 = space();
    			td1 = element("td");
    			if (if_block0) if_block0.c();
    			t2 = space();
    			t3 = text(t3_value);
    			t4 = space();
    			a = element("a");
    			t5 = text("🔎");
    			t6 = space();
    			br0 = element("br");
    			small = element("small");
    			t7 = text(t7_value);
    			t8 = space();
    			br1 = element("br");
    			t9 = space();
    			div = element("div");
    			i = element("i");
    			t10 = text(t10_value);
    			t11 = space();
    			td2 = element("td");
    			if_block1.c();
    			t12 = space();
    			td3 = element("td");
    			create_component(rendertypes.$$.fragment);
    			t13 = space();
    			td4 = element("td");
    			create_component(renderstars.$$.fragment);
    			t14 = space();
    			td5 = element("td");
    			create_component(renderdays.$$.fragment);
    			t15 = space();
    			td6 = element("td");
    			input = element("input");
    			t16 = space();
    			label = element("label");
    			t17 = text("✓");
    			t18 = space();
    			select = element("select");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			t19 = space();
    			if (if_block2) if_block2.c();
    			t20 = space();
    			if (if_block3) if_block3.c();
    			if_block3_anchor = empty();
    			attr(td0, "class", "jobnr svelte-9gtksp");
    			attr(a, "href", a_href_value = "https://www.google.no/maps/?q=" + encodeURIComponent(/*itemData*/ ctx[0][/*cols*/ ctx[6].ADDRESS]));
    			attr(a, "target", "_blank");
    			attr(small, "class", "area svelte-9gtksp");
    			attr(div, "class", "smallscreen svelte-9gtksp");
    			attr(td1, "tabindex", "0");
    			attr(td1, "class", "svelte-9gtksp");
    			toggle_class(td1, "expanded", /*expanded*/ ctx[2]);
    			toggle_class(td1, "loading", /*loading*/ ctx[4]);
    			attr(td2, "class", "car svelte-9gtksp");
    			attr(td3, "class", "typefilter svelte-9gtksp");
    			attr(td4, "class", "svelte-9gtksp");
    			attr(td5, "class", "svelte-9gtksp");
    			attr(input, "type", "checkbox");
    			attr(input, "id", input_id_value = "select" + /*itemData*/ ctx[0][/*cols*/ ctx[6].JOBNR]);
    			attr(input, "class", "svelte-9gtksp");
    			attr(label, "for", label_for_value = "select" + /*itemData*/ ctx[0][/*cols*/ ctx[6].JOBNR]);
    			attr(label, "tabindex", "0");
    			attr(label, "class", "svelte-9gtksp");
    			select.disabled = select_disabled_value = Boolean(/*itemData*/ ctx[0][/*cols*/ ctx[6].ASSIGNEE]);
    			attr(select, "class", "svelte-9gtksp");
    			if (/*itemData*/ ctx[0][/*cols*/ ctx[6].STATUS] === void 0) add_render_callback(() => /*select_change_handler*/ ctx[14].call(select));
    			attr(td6, "class", "statuscell svelte-9gtksp");
    			attr(tr, "class", "job svelte-9gtksp");
    			attr(tr, "data-id", tr_data_id_value = /*itemData*/ ctx[0][/*cols*/ ctx[6].JOBNR]);
    			toggle_class(tr, "itemSelected", /*itemSelected*/ ctx[1]);
    		},
    		m(target, anchor) {
    			insert(target, tr, anchor);
    			append(tr, td0);
    			append(td0, t0);
    			append(tr, t1);
    			append(tr, td1);
    			if (if_block0) if_block0.m(td1, null);
    			append(td1, t2);
    			append(td1, t3);
    			append(td1, t4);
    			append(td1, a);
    			append(a, t5);
    			append(td1, t6);
    			append(td1, br0);
    			append(td1, small);
    			append(small, t7);
    			append(td1, t8);
    			append(td1, br1);
    			append(td1, t9);
    			append(td1, div);
    			append(div, i);
    			append(i, t10);
    			append(tr, t11);
    			append(tr, td2);
    			if_block1.m(td2, null);
    			append(tr, t12);
    			append(tr, td3);
    			mount_component(rendertypes, td3, null);
    			append(tr, t13);
    			append(tr, td4);
    			mount_component(renderstars, td4, null);
    			append(tr, t14);
    			append(tr, td5);
    			mount_component(renderdays, td5, null);
    			append(tr, t15);
    			append(tr, td6);
    			append(td6, input);
    			input.checked = /*itemSelected*/ ctx[1];
    			append(td6, t16);
    			append(td6, label);
    			append(label, t17);
    			append(td6, t18);
    			append(td6, select);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(select, null);
    			}

    			select_option(select, /*itemData*/ ctx[0][/*cols*/ ctx[6].STATUS]);
    			append(td6, t19);
    			if (if_block2) if_block2.m(td6, null);
    			insert(target, t20, anchor);
    			if (if_block3) if_block3.m(target, anchor);
    			insert(target, if_block3_anchor, anchor);
    			current = true;

    			if (!mounted) {
    				dispose = [
    					listen(a, "click", stop_propagation(/*click_handler*/ ctx[10])),
    					listen(td1, "click", /*click_handler_1*/ ctx[11]),
    					listen(input, "change", /*input_change_handler*/ ctx[12]),
    					listen(input, "change", /*change_handler*/ ctx[13]),
    					listen(select, "change", /*select_change_handler*/ ctx[14]),
    					listen(select, "change", stop_propagation(/*change_handler_1*/ ctx[15])),
    					listen(td6, "click", /*click_handler_2*/ ctx[16])
    				];

    				mounted = true;
    			}
    		},
    		p(ctx, [dirty]) {
    			if ((!current || dirty & /*itemData*/ 1) && t0_value !== (t0_value = /*itemData*/ ctx[0][/*cols*/ ctx[6].JOBNR] + "")) set_data(t0, t0_value);

    			if (/*itemData*/ ctx[0].loading) {
    				if (if_block0) {
    					if (dirty & /*itemData*/ 1) {
    						transition_in(if_block0, 1);
    					}
    				} else {
    					if_block0 = create_if_block_5$1();
    					if_block0.c();
    					transition_in(if_block0, 1);
    					if_block0.m(td1, t2);
    				}
    			} else if (if_block0) {
    				group_outros();

    				transition_out(if_block0, 1, 1, () => {
    					if_block0 = null;
    				});

    				check_outros();
    			}

    			if ((!current || dirty & /*itemData*/ 1) && t3_value !== (t3_value = /*itemData*/ ctx[0][/*cols*/ ctx[6].ADDRESS] + "")) set_data(t3, t3_value);

    			if (!current || dirty & /*itemData, states*/ 1 && a_href_value !== (a_href_value = "https://www.google.no/maps/?q=" + encodeURIComponent(/*itemData*/ ctx[0][/*cols*/ ctx[6].ADDRESS]))) {
    				attr(a, "href", a_href_value);
    			}

    			if ((!current || dirty & /*itemData*/ 1) && t7_value !== (t7_value = /*itemData*/ ctx[0][/*cols*/ ctx[6].AREA] + "")) set_data(t7, t7_value);
    			if ((!current || dirty & /*itemData*/ 1) && t10_value !== (t10_value = /*itemData*/ ctx[0][/*cols*/ ctx[6].PICKUP_DAYS] + "")) set_data(t10, t10_value);

    			if (dirty & /*expanded*/ 4) {
    				toggle_class(td1, "expanded", /*expanded*/ ctx[2]);
    			}

    			if (dirty & /*loading*/ 16) {
    				toggle_class(td1, "loading", /*loading*/ ctx[4]);
    			}

    			if (current_block_type !== (current_block_type = select_block_type(ctx))) {
    				if_block1.d(1);
    				if_block1 = current_block_type(ctx);

    				if (if_block1) {
    					if_block1.c();
    					if_block1.m(td2, null);
    				}
    			}

    			const rendertypes_changes = {};
    			if (dirty & /*itemData*/ 1) rendertypes_changes.types = /*itemData*/ ctx[0][/*cols*/ ctx[6].TYPES];
    			rendertypes.$set(rendertypes_changes);
    			const renderstars_changes = {};
    			if (dirty & /*itemData*/ 1) renderstars_changes.qualityRanking = /*itemData*/ ctx[0][/*cols*/ ctx[6].QUALITY];
    			renderstars.$set(renderstars_changes);
    			const renderdays_changes = {};
    			if (dirty & /*itemData*/ 1) renderdays_changes.days = /*itemData*/ ctx[0][/*cols*/ ctx[6].PICKUP_DAYS];
    			renderdays.$set(renderdays_changes);

    			if (!current || dirty & /*itemData, states*/ 1 && input_id_value !== (input_id_value = "select" + /*itemData*/ ctx[0][/*cols*/ ctx[6].JOBNR])) {
    				attr(input, "id", input_id_value);
    			}

    			if (dirty & /*itemSelected*/ 2) {
    				input.checked = /*itemSelected*/ ctx[1];
    			}

    			if (!current || dirty & /*itemData, states*/ 1 && label_for_value !== (label_for_value = "select" + /*itemData*/ ctx[0][/*cols*/ ctx[6].JOBNR])) {
    				attr(label, "for", label_for_value);
    			}

    			if (dirty & /*states*/ 0) {
    				each_value = states;
    				let i;

    				for (i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context$6(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
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

    			if (!current || dirty & /*itemData, states*/ 1 && select_disabled_value !== (select_disabled_value = Boolean(/*itemData*/ ctx[0][/*cols*/ ctx[6].ASSIGNEE]))) {
    				select.disabled = select_disabled_value;
    			}

    			if (dirty & /*itemData, cols, states*/ 65) {
    				select_option(select, /*itemData*/ ctx[0][/*cols*/ ctx[6].STATUS]);
    			}

    			if (/*itemData*/ ctx[0][/*cols*/ ctx[6].ASSIGNEE]) {
    				if (if_block2) {
    					if_block2.p(ctx, dirty);
    				} else {
    					if_block2 = create_if_block_2$3(ctx);
    					if_block2.c();
    					if_block2.m(td6, null);
    				}
    			} else if (if_block2) {
    				if_block2.d(1);
    				if_block2 = null;
    			}

    			if (!current || dirty & /*itemData, states*/ 1 && tr_data_id_value !== (tr_data_id_value = /*itemData*/ ctx[0][/*cols*/ ctx[6].JOBNR])) {
    				attr(tr, "data-id", tr_data_id_value);
    			}

    			if (dirty & /*itemSelected*/ 2) {
    				toggle_class(tr, "itemSelected", /*itemSelected*/ ctx[1]);
    			}

    			if (/*expanded*/ ctx[2]) {
    				if (if_block3) {
    					if_block3.p(ctx, dirty);

    					if (dirty & /*expanded*/ 4) {
    						transition_in(if_block3, 1);
    					}
    				} else {
    					if_block3 = create_if_block$5(ctx);
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
    		i(local) {
    			if (current) return;
    			transition_in(if_block0);
    			transition_in(rendertypes.$$.fragment, local);
    			transition_in(renderstars.$$.fragment, local);
    			transition_in(renderdays.$$.fragment, local);
    			transition_in(if_block3);
    			current = true;
    		},
    		o(local) {
    			transition_out(if_block0);
    			transition_out(rendertypes.$$.fragment, local);
    			transition_out(renderstars.$$.fragment, local);
    			transition_out(renderdays.$$.fragment, local);
    			transition_out(if_block3);
    			current = false;
    		},
    		d(detaching) {
    			if (detaching) detach(tr);
    			if (if_block0) if_block0.d();
    			if_block1.d();
    			destroy_component(rendertypes);
    			destroy_component(renderstars);
    			destroy_component(renderdays);
    			destroy_each(each_blocks, detaching);
    			if (if_block2) if_block2.d();
    			if (detaching) detach(t20);
    			if (if_block3) if_block3.d(detaching);
    			if (detaching) detach(if_block3_anchor);
    			mounted = false;
    			run_all(dispose);
    		}
    	};
    }

    function statusVerbString(state) {
    	return state === 'Hentet' ? 'hentet' : 'henter nå';
    }

    function instance$7($$self, $$props, $$invalidate) {
    	let loading;
    	let $drivers;
    	component_subscribe($$self, drivers, $$value => $$invalidate(22, $drivers = $$value));
    	const dispatch = createEventDispatcher();
    	let { itemData } = $$props;
    	let { itemSelected = false } = $$props;
    	let { prefs } = $$props;
    	let cols = prefs.cols;
    	let expanded = false;
    	let showEditor = false;

    	function update(event) {
    		$$invalidate(3, showEditor = false);
    		return changeJobDetails(itemData[cols.JOBNR], cols, event.detail).catch(err => alert(err));
    	}

    	function getDriverName(number) {
    		let driver = $drivers.find(driver => driver.number === normalizeNumber(number));
    		return driver ? driver.name : normalizeNumber(number);
    	}

    	function click_handler(event) {
    		bubble.call(this, $$self, event);
    	}

    	const click_handler_1 = e => $$invalidate(2, expanded = !expanded);

    	function input_change_handler() {
    		itemSelected = this.checked;
    		$$invalidate(1, itemSelected);
    	}

    	const change_handler = e => dispatch('select', {
    		jobnr: itemData[cols.JOBNR],
    		selected: e.target.checked
    	});

    	function select_change_handler() {
    		itemData[cols.STATUS] = select_value(this);
    		$$invalidate(0, itemData);
    	}

    	const change_handler_1 = e => update({
    		detail: { [cols.STATUS]: e.target.value }
    	});

    	const click_handler_2 = e => {
    		if (['SELECT', 'LABEL', 'INPUT', 'OPTION', 'A'].indexOf(e.target.tagName) === -1) {
    			dispatch('select', {
    				jobnr: itemData[cols.JOBNR],
    				selected: !itemSelected
    			});
    		}
    	};

    	const click_handler_3 = e => $$invalidate(3, showEditor = true);
    	const cancel_handler = e => $$invalidate(3, showEditor = false);
    	const close_handler = () => $$invalidate(3, showEditor = false);

    	function textarea_input_handler() {
    		itemData[cols.ADMCOMMENT] = this.value;
    		$$invalidate(0, itemData);
    	}

    	const change_handler_2 = e => changeJobDetails(itemData[cols.JOBNR], cols, { [cols.ADMCOMMENT]: e.target.value });

    	$$self.$$set = $$props => {
    		if ('itemData' in $$props) $$invalidate(0, itemData = $$props.itemData);
    		if ('itemSelected' in $$props) $$invalidate(1, itemSelected = $$props.itemSelected);
    		if ('prefs' in $$props) $$invalidate(9, prefs = $$props.prefs);
    	};

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*itemData*/ 1) {
    			$$invalidate(4, loading = itemData.loading);
    		}
    	};

    	return [
    		itemData,
    		itemSelected,
    		expanded,
    		showEditor,
    		loading,
    		dispatch,
    		cols,
    		update,
    		getDriverName,
    		prefs,
    		click_handler,
    		click_handler_1,
    		input_change_handler,
    		change_handler,
    		select_change_handler,
    		change_handler_1,
    		click_handler_2,
    		click_handler_3,
    		cancel_handler,
    		close_handler,
    		textarea_input_handler,
    		change_handler_2
    	];
    }

    class RenderJob extends SvelteComponent {
    	constructor(options) {
    		super();
    		init(this, options, instance$7, create_fragment$7, safe_not_equal, { itemData: 0, itemSelected: 1, prefs: 9 }, add_css$6);
    	}
    }

    /* client/src/components/SMSEditor.svelte generated by Svelte v3.49.0 */

    function add_css$5(target) {
    	append_styles(target, "svelte-72ojky", "form.svelte-72ojky.svelte-72ojky{display:table;width:90%;margin-left:5%\n\t}p.svelte-72ojky.svelte-72ojky{display:table-row;width:100%;margin-top:8px}span.svelte-72ojky.svelte-72ojky{display:table-cell;vertical-align:top;padding-top:8px}span.svelte-72ojky.svelte-72ojky:first-child{width:30%}span.svelte-72ojky .svelte-72ojky{width:100%}span.svelte-72ojky button.svelte-72ojky{width:40%}span.svelte-72ojky button.svelte-72ojky:nth-child(2){margin-left:8px}textarea.svelte-72ojky.svelte-72ojky{height:100px}textarea.svelte-72ojky.svelte-72ojky,select.svelte-72ojky.svelte-72ojky{font-size:1em}.to.svelte-72ojky textarea.svelte-72ojky{width:90%;height:3em}.sms.svelte-72ojky textarea.svelte-72ojky{width:90%;height:200px}select.svelte-72ojky.svelte-72ojky{font-size:1em}");
    }

    function get_each_context$5(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[15] = list[i];
    	return child_ctx;
    }

    function get_each_context_1$1(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[18] = list[i];
    	return child_ctx;
    }

    // (91:3) {:else}
    function create_else_block$1(ctx) {
    	let textarea;
    	let mounted;
    	let dispose;

    	return {
    		c() {
    			textarea = element("textarea");
    			attr(textarea, "pattern", "[0-9 ,]");
    			textarea.required = true;
    			attr(textarea, "class", "svelte-72ojky");
    		},
    		m(target, anchor) {
    			insert(target, textarea, anchor);
    			set_input_value(textarea, /*recipients*/ ctx[0]);

    			if (!mounted) {
    				dispose = listen(textarea, "input", /*textarea_input_handler*/ ctx[10]);
    				mounted = true;
    			}
    		},
    		p(ctx, dirty) {
    			if (dirty & /*recipients, possibleRecipients*/ 5) {
    				set_input_value(textarea, /*recipients*/ ctx[0]);
    			}
    		},
    		d(detaching) {
    			if (detaching) detach(textarea);
    			mounted = false;
    			dispose();
    		}
    	};
    }

    // (83:3) {#if possibleRecipients && possibleRecipients.length}
    function create_if_block_1$2(ctx) {
    	let select;
    	let mounted;
    	let dispose;
    	let each_value_1 = /*possibleRecipients*/ ctx[2];
    	let each_blocks = [];

    	for (let i = 0; i < each_value_1.length; i += 1) {
    		each_blocks[i] = create_each_block_1$1(get_each_context_1$1(ctx, each_value_1, i));
    	}

    	return {
    		c() {
    			select = element("select");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			select.multiple = true;
    			select.required = true;
    			attr(select, "class", "svelte-72ojky");
    			if (/*recipients*/ ctx[0] === void 0) add_render_callback(() => /*select_change_handler*/ ctx[9].call(select));
    		},
    		m(target, anchor) {
    			insert(target, select, anchor);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(select, null);
    			}

    			select_options(select, /*recipients*/ ctx[0]);

    			if (!mounted) {
    				dispose = listen(select, "change", /*select_change_handler*/ ctx[9]);
    				mounted = true;
    			}
    		},
    		p(ctx, dirty) {
    			if (dirty & /*possibleRecipients*/ 4) {
    				each_value_1 = /*possibleRecipients*/ ctx[2];
    				let i;

    				for (i = 0; i < each_value_1.length; i += 1) {
    					const child_ctx = get_each_context_1$1(ctx, each_value_1, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    					} else {
    						each_blocks[i] = create_each_block_1$1(child_ctx);
    						each_blocks[i].c();
    						each_blocks[i].m(select, null);
    					}
    				}

    				for (; i < each_blocks.length; i += 1) {
    					each_blocks[i].d(1);
    				}

    				each_blocks.length = each_value_1.length;
    			}

    			if (dirty & /*recipients, possibleRecipients*/ 5) {
    				select_options(select, /*recipients*/ ctx[0]);
    			}
    		},
    		d(detaching) {
    			if (detaching) detach(select);
    			destroy_each(each_blocks, detaching);
    			mounted = false;
    			dispose();
    		}
    	};
    }

    // (87:23) {#if recipient.address}
    function create_if_block_2$2(ctx) {
    	let t0;
    	let t1_value = /*recipient*/ ctx[18].address + "";
    	let t1;

    	return {
    		c() {
    			t0 = text("- ");
    			t1 = text(t1_value);
    		},
    		m(target, anchor) {
    			insert(target, t0, anchor);
    			insert(target, t1, anchor);
    		},
    		p(ctx, dirty) {
    			if (dirty & /*possibleRecipients*/ 4 && t1_value !== (t1_value = /*recipient*/ ctx[18].address + "")) set_data(t1, t1_value);
    		},
    		d(detaching) {
    			if (detaching) detach(t0);
    			if (detaching) detach(t1);
    		}
    	};
    }

    // (85:5) {#each possibleRecipients as recipient}
    function create_each_block_1$1(ctx) {
    	let option;
    	let t0_value = /*recipient*/ ctx[18].name + "";
    	let t0;
    	let t1;
    	let option_value_value;
    	let if_block = /*recipient*/ ctx[18].address && create_if_block_2$2(ctx);

    	return {
    		c() {
    			option = element("option");
    			t0 = text(t0_value);
    			if (if_block) if_block.c();
    			t1 = space();
    			option.__value = option_value_value = /*recipient*/ ctx[18].number;
    			option.value = option.__value;
    			attr(option, "class", "svelte-72ojky");
    		},
    		m(target, anchor) {
    			insert(target, option, anchor);
    			append(option, t0);
    			if (if_block) if_block.m(option, null);
    			append(option, t1);
    		},
    		p(ctx, dirty) {
    			if (dirty & /*possibleRecipients*/ 4 && t0_value !== (t0_value = /*recipient*/ ctx[18].name + "")) set_data(t0, t0_value);

    			if (/*recipient*/ ctx[18].address) {
    				if (if_block) {
    					if_block.p(ctx, dirty);
    				} else {
    					if_block = create_if_block_2$2(ctx);
    					if_block.c();
    					if_block.m(option, t1);
    				}
    			} else if (if_block) {
    				if_block.d(1);
    				if_block = null;
    			}

    			if (dirty & /*possibleRecipients*/ 4 && option_value_value !== (option_value_value = /*recipient*/ ctx[18].number)) {
    				option.__value = option_value_value;
    				option.value = option.__value;
    			}
    		},
    		d(detaching) {
    			if (detaching) detach(option);
    			if (if_block) if_block.d();
    		}
    	};
    }

    // (103:1) {#if showQuickReplies}
    function create_if_block$4(ctx) {
    	let p;
    	let b;
    	let t1;
    	let span;
    	let select;
    	let option;
    	let mounted;
    	let dispose;
    	let each_value = Object.keys(/*stdMessages*/ ctx[5]);
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block$5(get_each_context$5(ctx, each_value, i));
    	}

    	return {
    		c() {
    			p = element("p");
    			b = element("b");
    			b.textContent = "Kjappe svar";
    			t1 = space();
    			span = element("span");
    			select = element("select");
    			option = element("option");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			option.__value = "";
    			option.value = option.__value;
    			attr(option, "class", "svelte-72ojky");
    			attr(select, "class", "svelte-72ojky");
    			attr(span, "class", "svelte-72ojky");
    			attr(p, "class", "svelte-72ojky");
    		},
    		m(target, anchor) {
    			insert(target, p, anchor);
    			append(p, b);
    			append(p, t1);
    			append(p, span);
    			append(span, select);
    			append(select, option);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(select, null);
    			}

    			if (!mounted) {
    				dispose = listen(select, "change", /*change_handler*/ ctx[12]);
    				mounted = true;
    			}
    		},
    		p(ctx, dirty) {
    			if (dirty & /*Object, stdMessages*/ 32) {
    				each_value = Object.keys(/*stdMessages*/ ctx[5]);
    				let i;

    				for (i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context$5(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    					} else {
    						each_blocks[i] = create_each_block$5(child_ctx);
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
    		d(detaching) {
    			if (detaching) detach(p);
    			destroy_each(each_blocks, detaching);
    			mounted = false;
    			dispose();
    		}
    	};
    }

    // (109:4) {#each Object.keys(stdMessages) as name}
    function create_each_block$5(ctx) {
    	let option;
    	let t_value = /*name*/ ctx[15] + "";
    	let t;

    	return {
    		c() {
    			option = element("option");
    			t = text(t_value);
    			option.__value = /*name*/ ctx[15];
    			option.value = option.__value;
    			attr(option, "class", "svelte-72ojky");
    		},
    		m(target, anchor) {
    			insert(target, option, anchor);
    			append(option, t);
    		},
    		p: noop,
    		d(detaching) {
    			if (detaching) detach(option);
    		}
    	};
    }

    function create_fragment$6(ctx) {
    	let form;
    	let p0;
    	let b0;
    	let span0;
    	let t1;
    	let p1;
    	let b1;
    	let t3;
    	let span1;
    	let textarea;
    	let t4;
    	let t5;
    	let p2;
    	let span2;
    	let t6;
    	let span3;
    	let button0;
    	let t8;
    	let button1;
    	let mounted;
    	let dispose;

    	function select_block_type(ctx, dirty) {
    		if (/*possibleRecipients*/ ctx[2] && /*possibleRecipients*/ ctx[2].length) return create_if_block_1$2;
    		return create_else_block$1;
    	}

    	let current_block_type = select_block_type(ctx);
    	let if_block0 = current_block_type(ctx);
    	let if_block1 = /*showQuickReplies*/ ctx[3] && create_if_block$4(ctx);

    	return {
    		c() {
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
    			attr(span0, "class", "to svelte-72ojky");
    			attr(p0, "class", "svelte-72ojky");
    			textarea.required = true;
    			attr(textarea, "class", "svelte-72ojky");
    			attr(span1, "class", "sms svelte-72ojky");
    			attr(p1, "class", "svelte-72ojky");
    			attr(span2, "class", "svelte-72ojky");
    			attr(button0, "type", "submit");
    			attr(button0, "class", "p8 br2 svelte-72ojky");
    			attr(button1, "class", "p8 br2 svelte-72ojky");
    			attr(button1, "type", "button");
    			attr(span3, "class", "svelte-72ojky");
    			attr(p2, "class", "svelte-72ojky");
    			attr(form, "class", "svelte-72ojky");
    		},
    		m(target, anchor) {
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
    			set_input_value(textarea, /*message*/ ctx[1]);
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

    			if (!mounted) {
    				dispose = [
    					listen(textarea, "input", /*textarea_input_handler_1*/ ctx[11]),
    					listen(button1, "click", /*click_handler*/ ctx[13]),
    					listen(form, "submit", prevent_default(/*submit_handler*/ ctx[14]))
    				];

    				mounted = true;
    			}
    		},
    		p(ctx, [dirty]) {
    			if (current_block_type === (current_block_type = select_block_type(ctx)) && if_block0) {
    				if_block0.p(ctx, dirty);
    			} else {
    				if_block0.d(1);
    				if_block0 = current_block_type(ctx);

    				if (if_block0) {
    					if_block0.c();
    					if_block0.m(span0, null);
    				}
    			}

    			if (dirty & /*message*/ 2) {
    				set_input_value(textarea, /*message*/ ctx[1]);
    			}

    			if (/*showQuickReplies*/ ctx[3]) if_block1.p(ctx, dirty);
    		},
    		i: noop,
    		o: noop,
    		d(detaching) {
    			if (detaching) detach(form);
    			if_block0.d();
    			if (if_block1) if_block1.d();
    			mounted = false;
    			run_all(dispose);
    		}
    	};
    }

    function instance$6($$self, $$props, $$invalidate) {
    	let { recipients = [] } = $$props;
    	let { message = '' } = $$props;
    	let { possibleRecipients } = $$props;
    	let { smsEditorType } = $$props;
    	let showQuickReplies = !message;
    	const dispatch = createEventDispatcher();

    	let stdMessages = {
    		'Bekreft data mottatt': 'Hei,\ntakk for at du har sendt inn skjema om loppehenting! :)\n\nVi henter hver kveld mellom 24. og 26. august. Vi kontakter deg på dette nummeret før henting.\n\nVennlig hilsen Ila og Bolteløkka skolekorps',
    		'Hentes snart': 'Hei,\ntakk for at du vil gi korpset lopper. Passer det om noen kommer og henter hos deg snart?\n\nVennlig hilsen Ila og Bolteløkka skolekorps',
    		'Ikke IKEA': 'Hei,\ntakk for at du vil gi korpset lopper! Dessverre har vi dårlig erfaring med å selge IKEA-møbler, så slike vil vi helst ikke ta imot.\n\nVennlig hilsen Ila og Bolteløkka skolekorps',
    		'Ikke sofa': 'Hei,\ntakk for at du vil gi korpset lopper! Dessverre har vi dårlig erfaring med å selge sofaer på loppemarked. Vi vil helst ikke ta imot sofaer med mindre de er av spesielt god kvalitet.\n\nVennlig hilsen Ila og Bolteløkka skolekorps',
    		'Rekker ikke': 'Hei,\ntakk for at du vil gi korpset lopper! Dessverre rekker vi ikke å hente loppene dine i kveld. Dersom du har mulighet til å levere i skolegården, er det supert.\n\nVennlig hilsen Ila og Bolteløkka skolekorps',
    		'For langt borte': 'Hei,\ntakk for at du vil gi korpset lopper! Dessverre rekker vi ikke å hente tingene dine, fordi det er litt for langt borte fra vårt område. Vi foreslår at du  tar kontakt med et lokalt korps og spør om de skal hente lopper snart.\n\nVennlig hilsen Ila og Bolteløkka skolekorps',
    		'Send foto?': 'Hei,\ntakk for at du vil gi korpset lopper! Kan du sende meg et foto av loppene?\n\nVennlig hilsen Ila og Bolteløkka skolekorps'
    	};

    	function send() {
    		if (typeof recipients === 'string') {
    			dispatch('sms', {
    				recipients: recipients.split(/,\s*/g),
    				message,
    				smsEditorType
    			});
    		} else {
    			dispatch('sms', { recipients, message, smsEditorType });
    		}
    	}

    	function addMessage(name) {
    		if (name && stdMessages[name]) {
    			$$invalidate(1, message = stdMessages[name]);
    		}
    	}

    	function select_change_handler() {
    		recipients = select_multiple_value(this);
    		$$invalidate(0, recipients);
    		$$invalidate(2, possibleRecipients);
    	}

    	function textarea_input_handler() {
    		recipients = this.value;
    		$$invalidate(0, recipients);
    		$$invalidate(2, possibleRecipients);
    	}

    	function textarea_input_handler_1() {
    		message = this.value;
    		$$invalidate(1, message);
    	}

    	const change_handler = e => addMessage(e.target.value);
    	const click_handler = e => dispatch('cancel');
    	const submit_handler = e => send();

    	$$self.$$set = $$props => {
    		if ('recipients' in $$props) $$invalidate(0, recipients = $$props.recipients);
    		if ('message' in $$props) $$invalidate(1, message = $$props.message);
    		if ('possibleRecipients' in $$props) $$invalidate(2, possibleRecipients = $$props.possibleRecipients);
    		if ('smsEditorType' in $$props) $$invalidate(8, smsEditorType = $$props.smsEditorType);
    	};

    	return [
    		recipients,
    		message,
    		possibleRecipients,
    		showQuickReplies,
    		dispatch,
    		stdMessages,
    		send,
    		addMessage,
    		smsEditorType,
    		select_change_handler,
    		textarea_input_handler,
    		textarea_input_handler_1,
    		change_handler,
    		click_handler,
    		submit_handler
    	];
    }

    class SMSEditor extends SvelteComponent {
    	constructor(options) {
    		super();

    		init(
    			this,
    			options,
    			instance$6,
    			create_fragment$6,
    			safe_not_equal,
    			{
    				recipients: 0,
    				message: 1,
    				possibleRecipients: 2,
    				smsEditorType: 8
    			},
    			add_css$5
    		);
    	}
    }

    /* client/src/components/DriverEditor.svelte generated by Svelte v3.49.0 */

    function add_css$4(target) {
    	append_styles(target, "svelte-nfxprn", "button.cancel.svelte-nfxprn.svelte-nfxprn{color:red;font-size:small;vertical-align:super}form.svelte-nfxprn.svelte-nfxprn{display:table;width:90%;margin-left:5%\n\t}p.svelte-nfxprn.svelte-nfxprn{display:table-row;width:100%;margin-top:8px}span.svelte-nfxprn.svelte-nfxprn{display:table-cell;vertical-align:top;padding-top:8px}span.svelte-nfxprn.svelte-nfxprn:first-child{width:30%}span.svelte-nfxprn .svelte-nfxprn{width:100%}span.svelte-nfxprn button.svelte-nfxprn{width:40%}span.svelte-nfxprn button.svelte-nfxprn:nth-child(2){margin-left:8px}");
    }

    function get_each_context$4(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[11] = list[i].name;
    	child_ctx[12] = list[i].number;
    	return child_ctx;
    }

    // (59:2) {#if $drivers.length}
    function create_if_block$3(ctx) {
    	let ul;
    	let each_value = /*$drivers*/ ctx[2];
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block$4(get_each_context$4(ctx, each_value, i));
    	}

    	return {
    		c() {
    			ul = element("ul");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}
    		},
    		m(target, anchor) {
    			insert(target, ul, anchor);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(ul, null);
    			}
    		},
    		p(ctx, dirty) {
    			if (dirty & /*removeDriver, $drivers*/ 36) {
    				each_value = /*$drivers*/ ctx[2];
    				let i;

    				for (i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context$4(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    					} else {
    						each_blocks[i] = create_each_block$4(child_ctx);
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
    		d(detaching) {
    			if (detaching) detach(ul);
    			destroy_each(each_blocks, detaching);
    		}
    	};
    }

    // (61:2) {#each $drivers as {name, number}}
    function create_each_block$4(ctx) {
    	let li;
    	let b;
    	let t0_value = /*name*/ ctx[11] + "";
    	let t0;
    	let t1;
    	let a;
    	let t2_value = /*number*/ ctx[12] + "";
    	let t2;
    	let a_href_value;
    	let t3;
    	let button;
    	let mounted;
    	let dispose;

    	function click_handler(...args) {
    		return /*click_handler*/ ctx[6](/*name*/ ctx[11], /*number*/ ctx[12], ...args);
    	}

    	return {
    		c() {
    			li = element("li");
    			b = element("b");
    			t0 = text(t0_value);
    			t1 = text(", ");
    			a = element("a");
    			t2 = text(t2_value);
    			t3 = space();
    			button = element("button");
    			button.textContent = "X";
    			attr(a, "href", a_href_value = "tel:" + /*number*/ ctx[12]);
    			attr(button, "class", "cancel br2 svelte-nfxprn");
    		},
    		m(target, anchor) {
    			insert(target, li, anchor);
    			append(li, b);
    			append(b, t0);
    			append(li, t1);
    			append(li, a);
    			append(a, t2);
    			append(li, t3);
    			append(li, button);

    			if (!mounted) {
    				dispose = listen(button, "click", click_handler);
    				mounted = true;
    			}
    		},
    		p(new_ctx, dirty) {
    			ctx = new_ctx;
    			if (dirty & /*$drivers*/ 4 && t0_value !== (t0_value = /*name*/ ctx[11] + "")) set_data(t0, t0_value);
    			if (dirty & /*$drivers*/ 4 && t2_value !== (t2_value = /*number*/ ctx[12] + "")) set_data(t2, t2_value);

    			if (dirty & /*$drivers*/ 4 && a_href_value !== (a_href_value = "tel:" + /*number*/ ctx[12])) {
    				attr(a, "href", a_href_value);
    			}
    		},
    		d(detaching) {
    			if (detaching) detach(li);
    			mounted = false;
    			dispose();
    		}
    	};
    }

    function create_fragment$5(ctx) {
    	let div;
    	let t0;
    	let form;
    	let p0;
    	let span0;
    	let span1;
    	let input0;
    	let t2;
    	let p1;
    	let span2;
    	let span3;
    	let input1;
    	let t4;
    	let p2;
    	let span4;
    	let span5;
    	let button0;
    	let t6;
    	let button1;
    	let mounted;
    	let dispose;
    	let if_block = /*$drivers*/ ctx[2].length && create_if_block$3(ctx);

    	return {
    		c() {
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
    			attr(span0, "class", "svelte-nfxprn");
    			input0.required = true;
    			attr(input0, "class", "svelte-nfxprn");
    			attr(span1, "class", "svelte-nfxprn");
    			attr(p0, "class", "svelte-nfxprn");
    			attr(span2, "class", "svelte-nfxprn");
    			attr(input1, "inputmode", "tel");
    			input1.required = true;
    			attr(input1, "class", "svelte-nfxprn");
    			attr(span3, "class", "svelte-nfxprn");
    			attr(p1, "class", "svelte-nfxprn");
    			attr(span4, "class", "svelte-nfxprn");
    			attr(button0, "type", "submit");
    			attr(button0, "class", "p8 br2 svelte-nfxprn");
    			attr(button1, "class", "p8 br2 svelte-nfxprn");
    			attr(button1, "type", "button");
    			attr(span5, "class", "svelte-nfxprn");
    			attr(p2, "class", "svelte-nfxprn");
    			attr(form, "class", "svelte-nfxprn");
    		},
    		m(target, anchor) {
    			insert(target, div, anchor);
    			if (if_block) if_block.m(div, null);
    			append(div, t0);
    			append(div, form);
    			append(form, p0);
    			append(p0, span0);
    			append(p0, span1);
    			append(span1, input0);
    			set_input_value(input0, /*addName*/ ctx[0]);
    			append(form, t2);
    			append(form, p1);
    			append(p1, span2);
    			append(p1, span3);
    			append(span3, input1);
    			set_input_value(input1, /*addNumber*/ ctx[1]);
    			append(form, t4);
    			append(form, p2);
    			append(p2, span4);
    			append(p2, span5);
    			append(span5, button0);
    			append(span5, t6);
    			append(span5, button1);

    			if (!mounted) {
    				dispose = [
    					listen(input0, "input", /*input0_input_handler*/ ctx[7]),
    					listen(input1, "input", /*input1_input_handler*/ ctx[8]),
    					listen(button1, "click", /*click_handler_1*/ ctx[9]),
    					listen(form, "submit", prevent_default(/*submit_handler*/ ctx[10]))
    				];

    				mounted = true;
    			}
    		},
    		p(ctx, [dirty]) {
    			if (/*$drivers*/ ctx[2].length) {
    				if (if_block) {
    					if_block.p(ctx, dirty);
    				} else {
    					if_block = create_if_block$3(ctx);
    					if_block.c();
    					if_block.m(div, t0);
    				}
    			} else if (if_block) {
    				if_block.d(1);
    				if_block = null;
    			}

    			if (dirty & /*addName*/ 1 && input0.value !== /*addName*/ ctx[0]) {
    				set_input_value(input0, /*addName*/ ctx[0]);
    			}

    			if (dirty & /*addNumber*/ 2 && input1.value !== /*addNumber*/ ctx[1]) {
    				set_input_value(input1, /*addNumber*/ ctx[1]);
    			}
    		},
    		i: noop,
    		o: noop,
    		d(detaching) {
    			if (detaching) detach(div);
    			if (if_block) if_block.d();
    			mounted = false;
    			run_all(dispose);
    		}
    	};
    }

    function instance$5($$self, $$props, $$invalidate) {
    	let $drivers;
    	component_subscribe($$self, drivers, $$value => $$invalidate(2, $drivers = $$value));
    	const dispatch = createEventDispatcher();
    	let addName = '';
    	let addNumber = '';

    	function createDriver(name, number) {
    		drivers.update(drivers => {
    			drivers.push({ name, number });
    			return drivers;
    		});

    		$$invalidate(1, addNumber = $$invalidate(0, addName = ''));
    	}

    	function removeDriver(name, number) {
    		drivers.update(drivers => {
    			let idx = drivers.findIndex(driver => driver.name === name && driver.number === number);
    			drivers.splice(idx, 1);
    			return drivers;
    		});
    	}

    	const click_handler = (name, number, e) => removeDriver(name, number);

    	function input0_input_handler() {
    		addName = this.value;
    		$$invalidate(0, addName);
    	}

    	function input1_input_handler() {
    		addNumber = this.value;
    		$$invalidate(1, addNumber);
    	}

    	const click_handler_1 = e => dispatch('cancel');
    	const submit_handler = e => createDriver(addName, addNumber);

    	return [
    		addName,
    		addNumber,
    		$drivers,
    		dispatch,
    		createDriver,
    		removeDriver,
    		click_handler,
    		input0_input_handler,
    		input1_input_handler,
    		click_handler_1,
    		submit_handler
    	];
    }

    class DriverEditor extends SvelteComponent {
    	constructor(options) {
    		super();
    		init(this, options, instance$5, create_fragment$5, safe_not_equal, {}, add_css$4);
    	}
    }

    /* client/src/components/StateEditor.svelte generated by Svelte v3.49.0 */

    function add_css$3(target) {
    	append_styles(target, "svelte-p9d98j", "form.svelte-p9d98j.svelte-p9d98j{display:table;width:90%;margin-left:5%\n\t}p.svelte-p9d98j.svelte-p9d98j{display:table-row;width:100%;margin-top:8px}span.svelte-p9d98j.svelte-p9d98j,b.svelte-p9d98j.svelte-p9d98j{display:table-cell;vertical-align:top;padding-top:8px}span.svelte-p9d98j.svelte-p9d98j:first-child{width:30%;font-weight:bold}span.svelte-p9d98j .svelte-p9d98j{width:100%}span.svelte-p9d98j button.svelte-p9d98j{width:40%}span.svelte-p9d98j button.svelte-p9d98j:nth-child(2){margin-left:8px}select.svelte-p9d98j.svelte-p9d98j{font-size:1em}");
    }

    function get_each_context$3(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[6] = list[i];
    	return child_ctx;
    }

    // (48:4) {#each states as theState}
    function create_each_block$3(ctx) {
    	let option;
    	let t_value = /*theState*/ ctx[6] + "";
    	let t;

    	return {
    		c() {
    			option = element("option");
    			t = text(t_value);
    			option.__value = /*theState*/ ctx[6];
    			option.value = option.__value;
    			attr(option, "class", "svelte-p9d98j");
    		},
    		m(target, anchor) {
    			insert(target, option, anchor);
    			append(option, t);
    		},
    		p: noop,
    		d(detaching) {
    			if (detaching) detach(option);
    		}
    	};
    }

    function create_fragment$4(ctx) {
    	let form;
    	let p0;
    	let b;
    	let t1;
    	let span0;
    	let select;
    	let t2;
    	let p1;
    	let span1;
    	let t3;
    	let span2;
    	let button0;
    	let t5;
    	let button1;
    	let mounted;
    	let dispose;
    	let each_value = states;
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block$3(get_each_context$3(ctx, each_value, i));
    	}

    	return {
    		c() {
    			form = element("form");
    			p0 = element("p");
    			b = element("b");
    			b.textContent = "Ny status:";
    			t1 = space();
    			span0 = element("span");
    			select = element("select");

    			for (let i = 0; i < each_blocks.length; i += 1) {
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
    			attr(b, "class", "svelte-p9d98j");
    			attr(select, "class", "svelte-p9d98j");
    			if (/*newState*/ ctx[0] === void 0) add_render_callback(() => /*select_change_handler*/ ctx[3].call(select));
    			attr(span0, "class", "svelte-p9d98j");
    			attr(p0, "class", "svelte-p9d98j");
    			attr(span1, "class", "svelte-p9d98j");
    			attr(button0, "type", "submit");
    			attr(button0, "class", "p8 br2 svelte-p9d98j");
    			attr(button1, "class", "p8 br2 svelte-p9d98j");
    			attr(button1, "type", "button");
    			attr(span2, "class", "svelte-p9d98j");
    			attr(p1, "class", "svelte-p9d98j");
    			attr(form, "class", "svelte-p9d98j");
    		},
    		m(target, anchor) {
    			insert(target, form, anchor);
    			append(form, p0);
    			append(p0, b);
    			append(p0, t1);
    			append(p0, span0);
    			append(span0, select);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(select, null);
    			}

    			select_option(select, /*newState*/ ctx[0]);
    			append(form, t2);
    			append(form, p1);
    			append(p1, span1);
    			append(p1, t3);
    			append(p1, span2);
    			append(span2, button0);
    			append(span2, t5);
    			append(span2, button1);

    			if (!mounted) {
    				dispose = [
    					listen(select, "change", /*select_change_handler*/ ctx[3]),
    					listen(button1, "click", /*click_handler*/ ctx[4]),
    					listen(form, "submit", prevent_default(/*submit_handler*/ ctx[5]))
    				];

    				mounted = true;
    			}
    		},
    		p(ctx, [dirty]) {
    			if (dirty & /*states*/ 0) {
    				each_value = states;
    				let i;

    				for (i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context$3(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    					} else {
    						each_blocks[i] = create_each_block$3(child_ctx);
    						each_blocks[i].c();
    						each_blocks[i].m(select, null);
    					}
    				}

    				for (; i < each_blocks.length; i += 1) {
    					each_blocks[i].d(1);
    				}

    				each_blocks.length = each_value.length;
    			}

    			if (dirty & /*newState, states*/ 1) {
    				select_option(select, /*newState*/ ctx[0]);
    			}
    		},
    		i: noop,
    		o: noop,
    		d(detaching) {
    			if (detaching) detach(form);
    			destroy_each(each_blocks, detaching);
    			mounted = false;
    			run_all(dispose);
    		}
    	};
    }

    function instance$4($$self, $$props, $$invalidate) {
    	const dispatch = createEventDispatcher();
    	let newState = '';

    	function send() {
    		dispatch('statusupdate', { newState });
    	}

    	function select_change_handler() {
    		newState = select_value(this);
    		$$invalidate(0, newState);
    	}

    	const click_handler = e => dispatch('cancel');
    	const submit_handler = e => send();
    	return [newState, dispatch, send, select_change_handler, click_handler, submit_handler];
    }

    class StateEditor extends SvelteComponent {
    	constructor(options) {
    		super();
    		init(this, options, instance$4, create_fragment$4, safe_not_equal, {}, add_css$3);
    	}
    }

    /* client/src/components/FlashMessage.svelte generated by Svelte v3.49.0 */

    function add_css$2(target) {
    	append_styles(target, "svelte-ni4itl", "div.svelte-ni4itl{position:fixed;bottom:0;left:0;width:100%;background:PowderBlue;font-size:1.1em;padding-top:8px;padding-bottom:8px;padding-left:8px;border-top:1px solid black}.isError.svelte-ni4itl{background:#ff7f7f}");
    }

    function create_fragment$3(ctx) {
    	let div;
    	let t;
    	let div_transition;
    	let current;

    	return {
    		c() {
    			div = element("div");
    			t = text(/*message*/ ctx[0]);
    			set_style(div, "bottom", 36 * /*index*/ ctx[2] + "px");
    			attr(div, "class", "svelte-ni4itl");
    			toggle_class(div, "isError", /*isError*/ ctx[1]);
    		},
    		m(target, anchor) {
    			insert(target, div, anchor);
    			append(div, t);
    			current = true;
    		},
    		p(ctx, [dirty]) {
    			if (!current || dirty & /*message*/ 1) set_data(t, /*message*/ ctx[0]);

    			if (!current || dirty & /*index*/ 4) {
    				set_style(div, "bottom", 36 * /*index*/ ctx[2] + "px");
    			}

    			if (dirty & /*isError*/ 2) {
    				toggle_class(div, "isError", /*isError*/ ctx[1]);
    			}
    		},
    		i(local) {
    			if (current) return;

    			add_render_callback(() => {
    				if (!div_transition) div_transition = create_bidirectional_transition(div, fly, { y: 50, duration: 500 }, true);
    				div_transition.run(1);
    			});

    			current = true;
    		},
    		o(local) {
    			if (!div_transition) div_transition = create_bidirectional_transition(div, fly, { y: 50, duration: 500 }, false);
    			div_transition.run(0);
    			current = false;
    		},
    		d(detaching) {
    			if (detaching) detach(div);
    			if (detaching && div_transition) div_transition.end();
    		}
    	};
    }

    function instance$3($$self, $$props, $$invalidate) {
    	let { message = '' } = $$props;
    	let { isError = false } = $$props;
    	let { index = 0 } = $$props;

    	$$self.$$set = $$props => {
    		if ('message' in $$props) $$invalidate(0, message = $$props.message);
    		if ('isError' in $$props) $$invalidate(1, isError = $$props.isError);
    		if ('index' in $$props) $$invalidate(2, index = $$props.index);
    	};

    	return [message, isError, index];
    }

    class FlashMessage extends SvelteComponent {
    	constructor(options) {
    		super();
    		init(this, options, instance$3, create_fragment$3, safe_not_equal, { message: 0, isError: 1, index: 2 }, add_css$2);
    	}
    }

    /* client/src/components/Menu.svelte generated by Svelte v3.49.0 */

    function add_css$1(target) {
    	append_styles(target, "svelte-1s9tfhz", "div.svelte-1s9tfhz{width:15%;background:#fff;padding:0px;min-width:140px;box-shadow:3px 6px 2px 0px rgba(189,182,189,1);position:fixed;z-index:10;display:none}.show.svelte-1s9tfhz{display:block}button.svelte-1s9tfhz{width:100%;background:transparent;border:1px solid grey;padding:6px;font-size:1.2em;margin:0;cursor:pointer;text-align:left}button.svelte-1s9tfhz:hover{border-color:black}img.svelte-1s9tfhz{width:24px;height:24px;vertical-align:middle}");
    }

    function get_each_context$2(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[4] = list[i];
    	return child_ctx;
    }

    // (50:3) {#if item.icon}
    function create_if_block$2(ctx) {
    	let img;
    	let img_src_value;

    	return {
    		c() {
    			img = element("img");
    			if (!src_url_equal(img.src, img_src_value = /*item*/ ctx[4].icon)) attr(img, "src", img_src_value);
    			attr(img, "alt", "");
    			attr(img, "class", "svelte-1s9tfhz");
    		},
    		m(target, anchor) {
    			insert(target, img, anchor);
    		},
    		p(ctx, dirty) {
    			if (dirty & /*items*/ 4 && !src_url_equal(img.src, img_src_value = /*item*/ ctx[4].icon)) {
    				attr(img, "src", img_src_value);
    			}
    		},
    		d(detaching) {
    			if (detaching) detach(img);
    		}
    	};
    }

    // (48:1) {#each items as item}
    function create_each_block$2(ctx) {
    	let button;
    	let t0;
    	let t1_value = /*item*/ ctx[4].label + "";
    	let t1;
    	let t2;
    	let mounted;
    	let dispose;
    	let if_block = /*item*/ ctx[4].icon && create_if_block$2(ctx);

    	return {
    		c() {
    			button = element("button");
    			if (if_block) if_block.c();
    			t0 = space();
    			t1 = text(t1_value);
    			t2 = space();
    			attr(button, "class", "menu svelte-1s9tfhz");
    		},
    		m(target, anchor) {
    			insert(target, button, anchor);
    			if (if_block) if_block.m(button, null);
    			append(button, t0);
    			append(button, t1);
    			append(button, t2);

    			if (!mounted) {
    				dispose = listen(button, "click", function () {
    					if (is_function(/*item*/ ctx[4].action)) /*item*/ ctx[4].action.apply(this, arguments);
    				});

    				mounted = true;
    			}
    		},
    		p(new_ctx, dirty) {
    			ctx = new_ctx;

    			if (/*item*/ ctx[4].icon) {
    				if (if_block) {
    					if_block.p(ctx, dirty);
    				} else {
    					if_block = create_if_block$2(ctx);
    					if_block.c();
    					if_block.m(button, t0);
    				}
    			} else if (if_block) {
    				if_block.d(1);
    				if_block = null;
    			}

    			if (dirty & /*items*/ 4 && t1_value !== (t1_value = /*item*/ ctx[4].label + "")) set_data(t1, t1_value);
    		},
    		d(detaching) {
    			if (detaching) detach(button);
    			if (if_block) if_block.d();
    			mounted = false;
    			dispose();
    		}
    	};
    }

    function create_fragment$2(ctx) {
    	let div;
    	let each_value = /*items*/ ctx[2];
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block$2(get_each_context$2(ctx, each_value, i));
    	}

    	return {
    		c() {
    			div = element("div");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			attr(div, "class", "menu svelte-1s9tfhz");
    			set_style(div, "top", /*y*/ ctx[3] + "px");
    			set_style(div, "left", /*x*/ ctx[0] + "px");
    			set_style(div, "position", "fixed");
    			toggle_class(div, "show", /*show*/ ctx[1]);
    		},
    		m(target, anchor) {
    			insert(target, div, anchor);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(div, null);
    			}
    		},
    		p(ctx, [dirty]) {
    			if (dirty & /*items*/ 4) {
    				each_value = /*items*/ ctx[2];
    				let i;

    				for (i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context$2(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
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

    			if (dirty & /*y*/ 8) {
    				set_style(div, "top", /*y*/ ctx[3] + "px");
    			}

    			if (dirty & /*x*/ 1) {
    				set_style(div, "left", /*x*/ ctx[0] + "px");
    			}

    			if (dirty & /*show*/ 2) {
    				toggle_class(div, "show", /*show*/ ctx[1]);
    			}
    		},
    		i: noop,
    		o: noop,
    		d(detaching) {
    			if (detaching) detach(div);
    			destroy_each(each_blocks, detaching);
    		}
    	};
    }

    function instance$2($$self, $$props, $$invalidate) {
    	let { show = false } = $$props;
    	let { items = [] } = $$props;
    	let { x = 0 } = $$props;
    	let { y = 0 } = $$props;
    	onMount(() => document.getElementsByTagName('button')[0].focus());

    	if (x <= 20) {
    		x = 20;
    	}

    	$$self.$$set = $$props => {
    		if ('show' in $$props) $$invalidate(1, show = $$props.show);
    		if ('items' in $$props) $$invalidate(2, items = $$props.items);
    		if ('x' in $$props) $$invalidate(0, x = $$props.x);
    		if ('y' in $$props) $$invalidate(3, y = $$props.y);
    	};

    	return [x, show, items, y];
    }

    class Menu extends SvelteComponent {
    	constructor(options) {
    		super();
    		init(this, options, instance$2, create_fragment$2, safe_not_equal, { show: 1, items: 2, x: 0, y: 3 }, add_css$1);
    	}
    }

    /* client/src/App.svelte generated by Svelte v3.49.0 */

    function get_each_context$1(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[78] = list[i];
    	child_ctx[80] = i;
    	return child_ctx;
    }

    function get_each_context_1(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[82] = list[i];
    	child_ctx[84] = i;
    	return child_ctx;
    }

    function get_each_context_2(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[85] = list[i];
    	return child_ctx;
    }

    // (447:0) {:catch error}
    function create_catch_block$1(ctx) {
    	let p;
    	let t_value = /*error*/ ctx[88].message + "";
    	let t;

    	return {
    		c() {
    			p = element("p");
    			t = text(t_value);
    			set_style(p, "color", "red");
    		},
    		m(target, anchor) {
    			insert(target, p, anchor);
    			append(p, t);
    		},
    		p(ctx, dirty) {
    			if (dirty[0] & /*promise*/ 32 && t_value !== (t_value = /*error*/ ctx[88].message + "")) set_data(t, t_value);
    		},
    		i: noop,
    		o: noop,
    		d(detaching) {
    			if (detaching) detach(p);
    		}
    	};
    }

    // (299:0) {:then data}
    function create_then_block$1(ctx) {
    	let table;
    	let tr;
    	let th0;
    	let input0;
    	let t0;
    	let th1;
    	let img0;
    	let img0_src_value;
    	let t1;
    	let img1;
    	let img1_src_value;
    	let t2;
    	let img2;
    	let img2_src_value;
    	let t3;
    	let th2;
    	let select0;
    	let option0;
    	let t5;
    	let th3;
    	let select1;
    	let option1;
    	let option2;
    	let option3;
    	let option4;
    	let t10;
    	let th4;
    	let ol;
    	let li0;
    	let t12;
    	let li1;
    	let t14;
    	let li2;
    	let t16;
    	let th5;
    	let label0;
    	let input1;
    	let t17;
    	let t18;
    	let br;
    	let label1;
    	let input2;
    	let t19;
    	let t20;
    	let t21;
    	let col0;
    	let t22;
    	let col1;
    	let t23;
    	let col2;
    	let t24;
    	let col3;
    	let t25;
    	let col4;
    	let t26;
    	let col5;
    	let t27;
    	let col6;
    	let t28;
    	let p;
    	let t29;
    	let t30_value = /*$jobs*/ ctx[26].length + "";
    	let t30;
    	let t31;
    	let t32_value = /*$jobs*/ ctx[26].filter(/*func*/ ctx[49]).length + "";
    	let t32;
    	let t33;
    	let t34_value = /*$jobs*/ ctx[26].filter(/*func_1*/ ctx[50]).length + "";
    	let t34;
    	let t35;
    	let t36_value = /*$jobs*/ ctx[26].filter(/*func_2*/ ctx[51]).length + "";
    	let t36;
    	let t37;
    	let t38;
    	let t39;
    	let if_block2_anchor;
    	let current;
    	let mounted;
    	let dispose;
    	let each_value_2 = /*prefs*/ ctx[16].types;
    	let each_blocks_1 = [];

    	for (let i = 0; i < each_value_2.length; i += 1) {
    		each_blocks_1[i] = create_each_block_2(get_each_context_2(ctx, each_value_2, i));
    	}

    	let each_value_1 = /*$jobs*/ ctx[26];
    	let each_blocks = [];

    	for (let i = 0; i < each_value_1.length; i += 1) {
    		each_blocks[i] = create_each_block_1(get_each_context_1(ctx, each_value_1, i));
    	}

    	const out = i => transition_out(each_blocks[i], 1, 1, () => {
    		each_blocks[i] = null;
    	});

    	let if_block0 = /*smsEditorType*/ ctx[0] && create_if_block_2$1(ctx);
    	let if_block1 = /*showDriverEditor*/ ctx[1] && create_if_block_1$1(ctx);
    	let if_block2 = /*showStateEditor*/ ctx[2] && create_if_block$1(ctx);

    	return {
    		c() {
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
    			img2 = element("img");
    			t3 = space();
    			th2 = element("th");
    			select0 = element("select");
    			option0 = element("option");
    			option0.textContent = "-";

    			for (let i = 0; i < each_blocks_1.length; i += 1) {
    				each_blocks_1[i].c();
    			}

    			t5 = space();
    			th3 = element("th");
    			select1 = element("select");
    			option1 = element("option");
    			option1.textContent = "-";
    			option2 = element("option");
    			option2.textContent = "★";
    			option3 = element("option");
    			option3.textContent = "★★";
    			option4 = element("option");
    			option4.textContent = "★★★";
    			t10 = space();
    			th4 = element("th");
    			ol = element("ol");
    			li0 = element("li");
    			li0.textContent = "Ti";
    			t12 = space();
    			li1 = element("li");
    			li1.textContent = "On";
    			t14 = space();
    			li2 = element("li");
    			li2.textContent = "To";
    			t16 = space();
    			th5 = element("th");
    			label0 = element("label");
    			input1 = element("input");
    			t17 = text("Bare valgte dager");
    			t18 = space();
    			br = element("br");
    			label1 = element("label");
    			input2 = element("input");
    			t19 = text("Skjul ferdige");
    			t20 = space();

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			t21 = space();
    			col0 = element("col");
    			t22 = space();
    			col1 = element("col");
    			t23 = space();
    			col2 = element("col");
    			t24 = space();
    			col3 = element("col");
    			t25 = space();
    			col4 = element("col");
    			t26 = space();
    			col5 = element("col");
    			t27 = space();
    			col6 = element("col");
    			t28 = space();
    			p = element("p");
    			t29 = text("Antall jobber totalt: ");
    			t30 = text(t30_value);
    			t31 = text(".\n\tHentes nå: ");
    			t32 = text(t32_value);
    			t33 = text("\n\tHentet: ");
    			t34 = text(t34_value);
    			t35 = text("\n\tHentes ikke: ");
    			t36 = text(t36_value);
    			t37 = space();
    			if (if_block0) if_block0.c();
    			t38 = space();
    			if (if_block1) if_block1.c();
    			t39 = space();
    			if (if_block2) if_block2.c();
    			if_block2_anchor = empty();
    			attr(input0, "type", "search");
    			attr(input0, "placeholder", "Filtrer");
    			attr(th0, "colspan", "2");
    			if (!src_url_equal(img0.src, img0_src_value = "/images/bigcar.png")) attr(img0, "src", img0_src_value);
    			attr(img0, "alt", "stor bil");
    			attr(img0, "height", "22");
    			attr(img0, "tabindex", "0");
    			toggle_class(img0, "bigActive", /*bigActive*/ ctx[7]);
    			if (!src_url_equal(img1.src, img1_src_value = "/images/smallcar.png")) attr(img1, "src", img1_src_value);
    			attr(img1, "alt", "stasjonsvogn");
    			attr(img1, "height", "22");
    			attr(img1, "tabindex", "0");
    			toggle_class(img1, "mediumActive", /*mediumActive*/ ctx[8]);
    			if (!src_url_equal(img2.src, img2_src_value = "/images/boxes.png")) attr(img2, "src", img2_src_value);
    			attr(img2, "alt", "1-3 bokser");
    			attr(img2, "height", "22");
    			attr(img2, "tabindex", "0");
    			toggle_class(img2, "smallActive", /*smallActive*/ ctx[9]);
    			option0.__value = "";
    			option0.value = option0.__value;
    			if (/*typeFilter*/ ctx[15] === void 0) add_render_callback(() => /*select0_change_handler*/ ctx[41].call(select0));
    			option1.__value = "";
    			option1.value = option1.__value;
    			option2.__value = "0";
    			option2.value = option2.__value;
    			option3.__value = "1";
    			option3.value = option3.__value;
    			option4.__value = "2";
    			option4.value = option4.__value;
    			if (/*qualityFilter*/ ctx[10] === void 0) add_render_callback(() => /*select1_change_handler*/ ctx[42].call(select1));
    			attr(li0, "tabindex", "0");
    			toggle_class(li0, "tueActive", /*tueActive*/ ctx[11]);
    			attr(li1, "tabindex", "0");
    			toggle_class(li1, "wedActive", /*wedActive*/ ctx[12]);
    			attr(li2, "tabindex", "0");
    			toggle_class(li2, "thuActive", /*thuActive*/ ctx[13]);
    			attr(ol, "class", "days");
    			attr(input1, "type", "checkbox");
    			attr(input2, "type", "checkbox");
    			attr(col0, "class", "jobnr");
    			attr(col1, "class", "address");
    			attr(col2, "class", "cartype");
    			attr(col3, "class", "stufftype");
    			attr(col4, "class", "quality");
    			attr(col5, "class", "dayscol");
    			attr(col6, "class", "status");
    			attr(table, "class", "main");
    		},
    		m(target, anchor) {
    			insert(target, table, anchor);
    			append(table, tr);
    			append(tr, th0);
    			append(th0, input0);
    			set_input_value(input0, /*freeTextFilter*/ ctx[6]);
    			append(tr, t0);
    			append(tr, th1);
    			append(th1, img0);
    			append(th1, t1);
    			append(th1, img1);
    			append(th1, t2);
    			append(th1, img2);
    			append(tr, t3);
    			append(tr, th2);
    			append(th2, select0);
    			append(select0, option0);

    			for (let i = 0; i < each_blocks_1.length; i += 1) {
    				each_blocks_1[i].m(select0, null);
    			}

    			select_option(select0, /*typeFilter*/ ctx[15]);
    			append(tr, t5);
    			append(tr, th3);
    			append(th3, select1);
    			append(select1, option1);
    			append(select1, option2);
    			append(select1, option3);
    			append(select1, option4);
    			select_option(select1, /*qualityFilter*/ ctx[10]);
    			append(tr, t10);
    			append(tr, th4);
    			append(th4, ol);
    			append(ol, li0);
    			append(ol, t12);
    			append(ol, li1);
    			append(ol, t14);
    			append(ol, li2);
    			append(tr, t16);
    			append(tr, th5);
    			append(th5, label0);
    			append(label0, input1);
    			input1.checked = /*dayFilterExclusive*/ ctx[14];
    			append(label0, t17);
    			append(th5, t18);
    			append(th5, br);
    			append(th5, label1);
    			append(label1, input2);
    			input2.checked = /*hideDoneJobs*/ ctx[22];
    			append(label1, t19);
    			append(table, t20);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(table, null);
    			}

    			append(table, t21);
    			append(table, col0);
    			append(table, t22);
    			append(table, col1);
    			append(table, t23);
    			append(table, col2);
    			append(table, t24);
    			append(table, col3);
    			append(table, t25);
    			append(table, col4);
    			append(table, t26);
    			append(table, col5);
    			append(table, t27);
    			append(table, col6);
    			insert(target, t28, anchor);
    			insert(target, p, anchor);
    			append(p, t29);
    			append(p, t30);
    			append(p, t31);
    			append(p, t32);
    			append(p, t33);
    			append(p, t34);
    			append(p, t35);
    			append(p, t36);
    			insert(target, t37, anchor);
    			if (if_block0) if_block0.m(target, anchor);
    			insert(target, t38, anchor);
    			if (if_block1) if_block1.m(target, anchor);
    			insert(target, t39, anchor);
    			if (if_block2) if_block2.m(target, anchor);
    			insert(target, if_block2_anchor, anchor);
    			current = true;

    			if (!mounted) {
    				dispose = [
    					listen(input0, "input", /*input0_input_handler*/ ctx[37]),
    					listen(img0, "click", /*click_handler_1*/ ctx[38]),
    					listen(img1, "click", /*click_handler_2*/ ctx[39]),
    					listen(img2, "click", /*click_handler_3*/ ctx[40]),
    					listen(select0, "change", /*select0_change_handler*/ ctx[41]),
    					listen(select1, "change", /*select1_change_handler*/ ctx[42]),
    					listen(li0, "click", /*click_handler_4*/ ctx[43]),
    					listen(li1, "click", /*click_handler_5*/ ctx[44]),
    					listen(li2, "click", /*click_handler_6*/ ctx[45]),
    					listen(input1, "change", /*input1_change_handler*/ ctx[46]),
    					listen(input2, "change", /*input2_change_handler*/ ctx[47])
    				];

    				mounted = true;
    			}
    		},
    		p(ctx, dirty) {
    			if (dirty[0] & /*freeTextFilter*/ 64) {
    				set_input_value(input0, /*freeTextFilter*/ ctx[6]);
    			}

    			if (dirty[0] & /*bigActive*/ 128) {
    				toggle_class(img0, "bigActive", /*bigActive*/ ctx[7]);
    			}

    			if (dirty[0] & /*mediumActive*/ 256) {
    				toggle_class(img1, "mediumActive", /*mediumActive*/ ctx[8]);
    			}

    			if (dirty[0] & /*smallActive*/ 512) {
    				toggle_class(img2, "smallActive", /*smallActive*/ ctx[9]);
    			}

    			if (dirty[0] & /*prefs*/ 65536) {
    				each_value_2 = /*prefs*/ ctx[16].types;
    				let i;

    				for (i = 0; i < each_value_2.length; i += 1) {
    					const child_ctx = get_each_context_2(ctx, each_value_2, i);

    					if (each_blocks_1[i]) {
    						each_blocks_1[i].p(child_ctx, dirty);
    					} else {
    						each_blocks_1[i] = create_each_block_2(child_ctx);
    						each_blocks_1[i].c();
    						each_blocks_1[i].m(select0, null);
    					}
    				}

    				for (; i < each_blocks_1.length; i += 1) {
    					each_blocks_1[i].d(1);
    				}

    				each_blocks_1.length = each_value_2.length;
    			}

    			if (dirty[0] & /*typeFilter, prefs*/ 98304) {
    				select_option(select0, /*typeFilter*/ ctx[15]);
    			}

    			if (dirty[0] & /*qualityFilter*/ 1024) {
    				select_option(select1, /*qualityFilter*/ ctx[10]);
    			}

    			if (dirty[0] & /*tueActive*/ 2048) {
    				toggle_class(li0, "tueActive", /*tueActive*/ ctx[11]);
    			}

    			if (dirty[0] & /*wedActive*/ 4096) {
    				toggle_class(li1, "wedActive", /*wedActive*/ ctx[12]);
    			}

    			if (dirty[0] & /*thuActive*/ 8192) {
    				toggle_class(li2, "thuActive", /*thuActive*/ ctx[13]);
    			}

    			if (dirty[0] & /*dayFilterExclusive*/ 16384) {
    				input1.checked = /*dayFilterExclusive*/ ctx[14];
    			}

    			if (dirty[0] & /*hideDoneJobs*/ 4194304) {
    				input2.checked = /*hideDoneJobs*/ ctx[22];
    			}

    			if (dirty[0] & /*$jobs, prefs, selectedItems, cols, updatedSelectedList, freeTextFilter, smallActive, mediumActive, bigActive, tueActive, wedActive, thuActive, dayFilterExclusive, typeFilter, qualityFilter, hideDoneJobs*/ 340262848) {
    				each_value_1 = /*$jobs*/ ctx[26];
    				let i;

    				for (i = 0; i < each_value_1.length; i += 1) {
    					const child_ctx = get_each_context_1(ctx, each_value_1, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    						transition_in(each_blocks[i], 1);
    					} else {
    						each_blocks[i] = create_each_block_1(child_ctx);
    						each_blocks[i].c();
    						transition_in(each_blocks[i], 1);
    						each_blocks[i].m(table, t21);
    					}
    				}

    				group_outros();

    				for (i = each_value_1.length; i < each_blocks.length; i += 1) {
    					out(i);
    				}

    				check_outros();
    			}

    			if ((!current || dirty[0] & /*$jobs*/ 67108864) && t30_value !== (t30_value = /*$jobs*/ ctx[26].length + "")) set_data(t30, t30_value);
    			if ((!current || dirty[0] & /*$jobs, cols*/ 67239936) && t32_value !== (t32_value = /*$jobs*/ ctx[26].filter(/*func*/ ctx[49]).length + "")) set_data(t32, t32_value);
    			if ((!current || dirty[0] & /*$jobs, cols*/ 67239936) && t34_value !== (t34_value = /*$jobs*/ ctx[26].filter(/*func_1*/ ctx[50]).length + "")) set_data(t34, t34_value);
    			if ((!current || dirty[0] & /*$jobs, cols*/ 67239936) && t36_value !== (t36_value = /*$jobs*/ ctx[26].filter(/*func_2*/ ctx[51]).length + "")) set_data(t36, t36_value);

    			if (/*smsEditorType*/ ctx[0]) {
    				if (if_block0) {
    					if_block0.p(ctx, dirty);

    					if (dirty[0] & /*smsEditorType*/ 1) {
    						transition_in(if_block0, 1);
    					}
    				} else {
    					if_block0 = create_if_block_2$1(ctx);
    					if_block0.c();
    					transition_in(if_block0, 1);
    					if_block0.m(t38.parentNode, t38);
    				}
    			} else if (if_block0) {
    				group_outros();

    				transition_out(if_block0, 1, 1, () => {
    					if_block0 = null;
    				});

    				check_outros();
    			}

    			if (/*showDriverEditor*/ ctx[1]) {
    				if (if_block1) {
    					if_block1.p(ctx, dirty);

    					if (dirty[0] & /*showDriverEditor*/ 2) {
    						transition_in(if_block1, 1);
    					}
    				} else {
    					if_block1 = create_if_block_1$1(ctx);
    					if_block1.c();
    					transition_in(if_block1, 1);
    					if_block1.m(t39.parentNode, t39);
    				}
    			} else if (if_block1) {
    				group_outros();

    				transition_out(if_block1, 1, 1, () => {
    					if_block1 = null;
    				});

    				check_outros();
    			}

    			if (/*showStateEditor*/ ctx[2]) {
    				if (if_block2) {
    					if_block2.p(ctx, dirty);

    					if (dirty[0] & /*showStateEditor*/ 4) {
    						transition_in(if_block2, 1);
    					}
    				} else {
    					if_block2 = create_if_block$1(ctx);
    					if_block2.c();
    					transition_in(if_block2, 1);
    					if_block2.m(if_block2_anchor.parentNode, if_block2_anchor);
    				}
    			} else if (if_block2) {
    				group_outros();

    				transition_out(if_block2, 1, 1, () => {
    					if_block2 = null;
    				});

    				check_outros();
    			}
    		},
    		i(local) {
    			if (current) return;

    			for (let i = 0; i < each_value_1.length; i += 1) {
    				transition_in(each_blocks[i]);
    			}

    			transition_in(if_block0);
    			transition_in(if_block1);
    			transition_in(if_block2);
    			current = true;
    		},
    		o(local) {
    			each_blocks = each_blocks.filter(Boolean);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				transition_out(each_blocks[i]);
    			}

    			transition_out(if_block0);
    			transition_out(if_block1);
    			transition_out(if_block2);
    			current = false;
    		},
    		d(detaching) {
    			if (detaching) detach(table);
    			destroy_each(each_blocks_1, detaching);
    			destroy_each(each_blocks, detaching);
    			if (detaching) detach(t28);
    			if (detaching) detach(p);
    			if (detaching) detach(t37);
    			if (if_block0) if_block0.d(detaching);
    			if (detaching) detach(t38);
    			if (if_block1) if_block1.d(detaching);
    			if (detaching) detach(t39);
    			if (if_block2) if_block2.d(detaching);
    			if (detaching) detach(if_block2_anchor);
    			mounted = false;
    			run_all(dispose);
    		}
    	};
    }

    // (320:5) {#each prefs.types as theType}
    function create_each_block_2(ctx) {
    	let option;
    	let t_value = /*theType*/ ctx[85] + "";
    	let t;
    	let option_value_value;

    	return {
    		c() {
    			option = element("option");
    			t = text(t_value);
    			option.__value = option_value_value = /*theType*/ ctx[85];
    			option.value = option.__value;
    		},
    		m(target, anchor) {
    			insert(target, option, anchor);
    			append(option, t);
    		},
    		p(ctx, dirty) {
    			if (dirty[0] & /*prefs*/ 65536 && t_value !== (t_value = /*theType*/ ctx[85] + "")) set_data(t, t_value);

    			if (dirty[0] & /*prefs*/ 65536 && option_value_value !== (option_value_value = /*theType*/ ctx[85])) {
    				option.__value = option_value_value;
    				option.value = option.__value;
    			}
    		},
    		d(detaching) {
    			if (detaching) detach(option);
    		}
    	};
    }

    // (347:2) {#if filter(freeTextFilter, {smallActive, mediumActive, bigActive},    {monActive, tueActive, wedActive, thuActive, dayFilterExclusive}, typeFilter,    qualityFilter,    hideDoneJobs, drivers, theJob, cols)   }
    function create_if_block_3$1(ctx) {
    	let renderjob;
    	let current;

    	renderjob = new RenderJob({
    			props: {
    				itemData: /*theJob*/ ctx[82],
    				prefs: /*prefs*/ ctx[16],
    				itemSelected: /*selectedItems*/ ctx[18].indexOf(/*theJob*/ ctx[82][/*cols*/ ctx[17].JOBNR]) > -1
    			}
    		});

    	renderjob.$on("select", /*select_handler*/ ctx[48]);

    	return {
    		c() {
    			create_component(renderjob.$$.fragment);
    		},
    		m(target, anchor) {
    			mount_component(renderjob, target, anchor);
    			current = true;
    		},
    		p(ctx, dirty) {
    			const renderjob_changes = {};
    			if (dirty[0] & /*$jobs*/ 67108864) renderjob_changes.itemData = /*theJob*/ ctx[82];
    			if (dirty[0] & /*prefs*/ 65536) renderjob_changes.prefs = /*prefs*/ ctx[16];
    			if (dirty[0] & /*selectedItems, $jobs, cols*/ 67502080) renderjob_changes.itemSelected = /*selectedItems*/ ctx[18].indexOf(/*theJob*/ ctx[82][/*cols*/ ctx[17].JOBNR]) > -1;
    			renderjob.$set(renderjob_changes);
    		},
    		i(local) {
    			if (current) return;
    			transition_in(renderjob.$$.fragment, local);
    			current = true;
    		},
    		o(local) {
    			transition_out(renderjob.$$.fragment, local);
    			current = false;
    		},
    		d(detaching) {
    			destroy_component(renderjob, detaching);
    		}
    	};
    }

    // (346:1) {#each $jobs as theJob, i}
    function create_each_block_1(ctx) {
    	let show_if = filter(
    		/*freeTextFilter*/ ctx[6],
    		{
    			smallActive: /*smallActive*/ ctx[9],
    			mediumActive: /*mediumActive*/ ctx[8],
    			bigActive: /*bigActive*/ ctx[7]
    		},
    		{
    			monActive,
    			tueActive: /*tueActive*/ ctx[11],
    			wedActive: /*wedActive*/ ctx[12],
    			thuActive: /*thuActive*/ ctx[13],
    			dayFilterExclusive: /*dayFilterExclusive*/ ctx[14]
    		},
    		/*typeFilter*/ ctx[15],
    		/*qualityFilter*/ ctx[10],
    		/*hideDoneJobs*/ ctx[22],
    		drivers,
    		/*theJob*/ ctx[82],
    		/*cols*/ ctx[17]
    	);

    	let if_block_anchor;
    	let current;
    	let if_block = show_if && create_if_block_3$1(ctx);

    	return {
    		c() {
    			if (if_block) if_block.c();
    			if_block_anchor = empty();
    		},
    		m(target, anchor) {
    			if (if_block) if_block.m(target, anchor);
    			insert(target, if_block_anchor, anchor);
    			current = true;
    		},
    		p(ctx, dirty) {
    			if (dirty[0] & /*freeTextFilter, smallActive, mediumActive, bigActive, tueActive, wedActive, thuActive, dayFilterExclusive, typeFilter, qualityFilter, hideDoneJobs, $jobs, cols*/ 71499712) show_if = filter(
    				/*freeTextFilter*/ ctx[6],
    				{
    					smallActive: /*smallActive*/ ctx[9],
    					mediumActive: /*mediumActive*/ ctx[8],
    					bigActive: /*bigActive*/ ctx[7]
    				},
    				{
    					monActive,
    					tueActive: /*tueActive*/ ctx[11],
    					wedActive: /*wedActive*/ ctx[12],
    					thuActive: /*thuActive*/ ctx[13],
    					dayFilterExclusive: /*dayFilterExclusive*/ ctx[14]
    				},
    				/*typeFilter*/ ctx[15],
    				/*qualityFilter*/ ctx[10],
    				/*hideDoneJobs*/ ctx[22],
    				drivers,
    				/*theJob*/ ctx[82],
    				/*cols*/ ctx[17]
    			);

    			if (show_if) {
    				if (if_block) {
    					if_block.p(ctx, dirty);

    					if (dirty[0] & /*freeTextFilter, smallActive, mediumActive, bigActive, tueActive, wedActive, thuActive, dayFilterExclusive, typeFilter, qualityFilter, hideDoneJobs, $jobs, cols*/ 71499712) {
    						transition_in(if_block, 1);
    					}
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
    		i(local) {
    			if (current) return;
    			transition_in(if_block);
    			current = true;
    		},
    		o(local) {
    			transition_out(if_block);
    			current = false;
    		},
    		d(detaching) {
    			if (if_block) if_block.d(detaching);
    			if (detaching) detach(if_block_anchor);
    		}
    	};
    }

    // (376:0) {#if smsEditorType}
    function create_if_block_2$1(ctx) {
    	let modal;
    	let current;

    	modal = new Modal({
    			props: {
    				$$slots: {
    					header: [create_header_slot_2],
    					default: [create_default_slot_2]
    				},
    				$$scope: { ctx }
    			}
    		});

    	modal.$on("close", /*close_handler*/ ctx[54]);

    	return {
    		c() {
    			create_component(modal.$$.fragment);
    		},
    		m(target, anchor) {
    			mount_component(modal, target, anchor);
    			current = true;
    		},
    		p(ctx, dirty) {
    			const modal_changes = {};

    			if (dirty[0] & /*smsEditorType, possibleRecipients, recipients, message, selectedItems, $jobs, cols*/ 71172097 | dirty[2] & /*$$scope*/ 134217728) {
    				modal_changes.$$scope = { dirty, ctx };
    			}

    			modal.$set(modal_changes);
    		},
    		i(local) {
    			if (current) return;
    			transition_in(modal.$$.fragment, local);
    			current = true;
    		},
    		o(local) {
    			transition_out(modal.$$.fragment, local);
    			current = false;
    		},
    		d(detaching) {
    			destroy_component(modal, detaching);
    		}
    	};
    }

    // (377:1) <Modal on:close="{() => smsEditorType = ''}">
    function create_default_slot_2(ctx) {
    	let smseditor;
    	let current;

    	smseditor = new SMSEditor({
    			props: {
    				smsEditorType: /*smsEditorType*/ ctx[0],
    				possibleRecipients: /*possibleRecipients*/ ctx[19],
    				recipients: /*recipients*/ ctx[20],
    				message: /*message*/ ctx[21]
    			}
    		});

    	smseditor.$on("cancel", /*cancel_handler*/ ctx[52]);
    	smseditor.$on("sms", /*sms_handler*/ ctx[53]);

    	return {
    		c() {
    			create_component(smseditor.$$.fragment);
    		},
    		m(target, anchor) {
    			mount_component(smseditor, target, anchor);
    			current = true;
    		},
    		p(ctx, dirty) {
    			const smseditor_changes = {};
    			if (dirty[0] & /*smsEditorType*/ 1) smseditor_changes.smsEditorType = /*smsEditorType*/ ctx[0];
    			if (dirty[0] & /*possibleRecipients*/ 524288) smseditor_changes.possibleRecipients = /*possibleRecipients*/ ctx[19];
    			if (dirty[0] & /*recipients*/ 1048576) smseditor_changes.recipients = /*recipients*/ ctx[20];
    			if (dirty[0] & /*message*/ 2097152) smseditor_changes.message = /*message*/ ctx[21];
    			smseditor.$set(smseditor_changes);
    		},
    		i(local) {
    			if (current) return;
    			transition_in(smseditor.$$.fragment, local);
    			current = true;
    		},
    		o(local) {
    			transition_out(smseditor.$$.fragment, local);
    			current = false;
    		},
    		d(detaching) {
    			destroy_component(smseditor, detaching);
    		}
    	};
    }

    // (378:2) 
    function create_header_slot_2(ctx) {
    	let h2;

    	return {
    		c() {
    			h2 = element("h2");
    			h2.textContent = "Send SMS";
    			attr(h2, "slot", "header");
    		},
    		m(target, anchor) {
    			insert(target, h2, anchor);
    		},
    		p: noop,
    		d(detaching) {
    			if (detaching) detach(h2);
    		}
    	};
    }

    // (414:0) {#if showDriverEditor}
    function create_if_block_1$1(ctx) {
    	let modal;
    	let current;

    	modal = new Modal({
    			props: {
    				$$slots: {
    					header: [create_header_slot_1],
    					default: [create_default_slot_1]
    				},
    				$$scope: { ctx }
    			}
    		});

    	modal.$on("close", /*close_handler_1*/ ctx[56]);

    	return {
    		c() {
    			create_component(modal.$$.fragment);
    		},
    		m(target, anchor) {
    			mount_component(modal, target, anchor);
    			current = true;
    		},
    		p(ctx, dirty) {
    			const modal_changes = {};

    			if (dirty[0] & /*showDriverEditor*/ 2 | dirty[2] & /*$$scope*/ 134217728) {
    				modal_changes.$$scope = { dirty, ctx };
    			}

    			modal.$set(modal_changes);
    		},
    		i(local) {
    			if (current) return;
    			transition_in(modal.$$.fragment, local);
    			current = true;
    		},
    		o(local) {
    			transition_out(modal.$$.fragment, local);
    			current = false;
    		},
    		d(detaching) {
    			destroy_component(modal, detaching);
    		}
    	};
    }

    // (415:1) <Modal on:close="{() => showDriverEditor = false}">
    function create_default_slot_1(ctx) {
    	let drivereditor;
    	let current;
    	drivereditor = new DriverEditor({});
    	drivereditor.$on("cancel", /*cancel_handler_1*/ ctx[55]);

    	return {
    		c() {
    			create_component(drivereditor.$$.fragment);
    		},
    		m(target, anchor) {
    			mount_component(drivereditor, target, anchor);
    			current = true;
    		},
    		p: noop,
    		i(local) {
    			if (current) return;
    			transition_in(drivereditor.$$.fragment, local);
    			current = true;
    		},
    		o(local) {
    			transition_out(drivereditor.$$.fragment, local);
    			current = false;
    		},
    		d(detaching) {
    			destroy_component(drivereditor, detaching);
    		}
    	};
    }

    // (416:2) 
    function create_header_slot_1(ctx) {
    	let h2;

    	return {
    		c() {
    			h2 = element("h2");
    			h2.textContent = "Oppdater hentere";
    			attr(h2, "slot", "header");
    		},
    		m(target, anchor) {
    			insert(target, h2, anchor);
    		},
    		p: noop,
    		d(detaching) {
    			if (detaching) detach(h2);
    		}
    	};
    }

    // (424:0) {#if showStateEditor}
    function create_if_block$1(ctx) {
    	let modal;
    	let current;

    	modal = new Modal({
    			props: {
    				$$slots: {
    					header: [create_header_slot],
    					default: [create_default_slot]
    				},
    				$$scope: { ctx }
    			}
    		});

    	modal.$on("close", /*close_handler_2*/ ctx[59]);

    	return {
    		c() {
    			create_component(modal.$$.fragment);
    		},
    		m(target, anchor) {
    			mount_component(modal, target, anchor);
    			current = true;
    		},
    		p(ctx, dirty) {
    			const modal_changes = {};

    			if (dirty[0] & /*showStateEditor, selectedItems, $jobs, cols*/ 67502084 | dirty[2] & /*$$scope*/ 134217728) {
    				modal_changes.$$scope = { dirty, ctx };
    			}

    			modal.$set(modal_changes);
    		},
    		i(local) {
    			if (current) return;
    			transition_in(modal.$$.fragment, local);
    			current = true;
    		},
    		o(local) {
    			transition_out(modal.$$.fragment, local);
    			current = false;
    		},
    		d(detaching) {
    			destroy_component(modal, detaching);
    		}
    	};
    }

    // (425:1) <Modal on:close="{() => showStateEditor = false}">
    function create_default_slot(ctx) {
    	let stateeditor;
    	let current;
    	stateeditor = new StateEditor({});
    	stateeditor.$on("cancel", /*cancel_handler_2*/ ctx[57]);
    	stateeditor.$on("statusupdate", /*statusupdate_handler*/ ctx[58]);

    	return {
    		c() {
    			create_component(stateeditor.$$.fragment);
    		},
    		m(target, anchor) {
    			mount_component(stateeditor, target, anchor);
    			current = true;
    		},
    		p: noop,
    		i(local) {
    			if (current) return;
    			transition_in(stateeditor.$$.fragment, local);
    			current = true;
    		},
    		o(local) {
    			transition_out(stateeditor.$$.fragment, local);
    			current = false;
    		},
    		d(detaching) {
    			destroy_component(stateeditor, detaching);
    		}
    	};
    }

    // (426:2) 
    function create_header_slot(ctx) {
    	let h2;

    	return {
    		c() {
    			h2 = element("h2");
    			h2.textContent = "Oppdater status";
    			attr(h2, "slot", "header");
    		},
    		m(target, anchor) {
    			insert(target, h2, anchor);
    		},
    		p: noop,
    		d(detaching) {
    			if (detaching) detach(h2);
    		}
    	};
    }

    // (296:16)   <div class="dataloading"><LoadingIcon /></div>  <p style="text-align: center;">...henter data</p> {:then data}
    function create_pending_block$1(ctx) {
    	let div;
    	let loadingicon;
    	let t0;
    	let p;
    	let current;
    	loadingicon = new LoadingIcon({});

    	return {
    		c() {
    			div = element("div");
    			create_component(loadingicon.$$.fragment);
    			t0 = space();
    			p = element("p");
    			p.textContent = "...henter data";
    			attr(div, "class", "dataloading");
    			set_style(p, "text-align", "center");
    		},
    		m(target, anchor) {
    			insert(target, div, anchor);
    			mount_component(loadingicon, div, null);
    			insert(target, t0, anchor);
    			insert(target, p, anchor);
    			current = true;
    		},
    		p: noop,
    		i(local) {
    			if (current) return;
    			transition_in(loadingicon.$$.fragment, local);
    			current = true;
    		},
    		o(local) {
    			transition_out(loadingicon.$$.fragment, local);
    			current = false;
    		},
    		d(detaching) {
    			if (detaching) detach(div);
    			destroy_component(loadingicon);
    			if (detaching) detach(t0);
    			if (detaching) detach(p);
    		}
    	};
    }

    // (501:0) {#each tempMsgQueue as msg, idx}
    function create_each_block$1(ctx) {
    	let flashmessage;
    	let current;
    	const flashmessage_spread_levels = [/*msg*/ ctx[78], { index: /*idx*/ ctx[80] }];
    	let flashmessage_props = {};

    	for (let i = 0; i < flashmessage_spread_levels.length; i += 1) {
    		flashmessage_props = assign(flashmessage_props, flashmessage_spread_levels[i]);
    	}

    	flashmessage = new FlashMessage({ props: flashmessage_props });

    	return {
    		c() {
    			create_component(flashmessage.$$.fragment);
    		},
    		m(target, anchor) {
    			mount_component(flashmessage, target, anchor);
    			current = true;
    		},
    		p(ctx, dirty) {
    			const flashmessage_changes = (dirty[0] & /*tempMsgQueue*/ 33554432)
    			? get_spread_update(flashmessage_spread_levels, [get_spread_object(/*msg*/ ctx[78]), flashmessage_spread_levels[1]])
    			: {};

    			flashmessage.$set(flashmessage_changes);
    		},
    		i(local) {
    			if (current) return;
    			transition_in(flashmessage.$$.fragment, local);
    			current = true;
    		},
    		o(local) {
    			transition_out(flashmessage.$$.fragment, local);
    			current = false;
    		},
    		d(detaching) {
    			destroy_component(flashmessage, detaching);
    		}
    	};
    }

    function create_fragment$1(ctx) {
    	let div;
    	let button;
    	let t0;
    	let h1;
    	let t2;
    	let style;
    	let t4;
    	let promise_1;
    	let t5;
    	let menu0;
    	let t6;
    	let menu1;
    	let t7;
    	let current;
    	let mounted;
    	let dispose;

    	let info = {
    		ctx,
    		current: null,
    		token: null,
    		hasCatch: true,
    		pending: create_pending_block$1,
    		then: create_then_block$1,
    		catch: create_catch_block$1,
    		value: 81,
    		error: 88,
    		blocks: [,,,]
    	};

    	handle_promise(promise_1 = /*promise*/ ctx[5], info);

    	menu0 = new Menu({
    			props: {
    				show: /*showMenu*/ ctx[3],
    				x: /*menuX*/ ctx[23],
    				y: /*menuY*/ ctx[24],
    				items: [
    					{
    						label: 'SMS til giver',
    						icon: '/images/sms.png',
    						action: /*func_3*/ ctx[60]
    					},
    					{
    						label: 'SMS til henter',
    						icon: '/images/sms.png',
    						action: /*func_4*/ ctx[61]
    					},
    					{
    						label: 'Sett status',
    						icon: '/images/wrench.png',
    						action: /*func_5*/ ctx[62]
    					},
    					{
    						label: 'Vis på kart',
    						icon: '/images/map.png',
    						action: /*func_6*/ ctx[63]
    					}
    				]
    			}
    		});

    	menu1 = new Menu({
    			props: {
    				show: /*showConfigMenu*/ ctx[4],
    				x: /*menuX*/ ctx[23],
    				y: /*menuY*/ ctx[24],
    				items: [
    					{
    						label: 'Hentere',
    						icon: '/images/smallcar.png',
    						action: /*func_7*/ ctx[64]
    					},
    					{
    						label: 'Oppdater data',
    						icon: '/images/wrench.png',
    						action: /*func_8*/ ctx[65]
    					},
    					{
    						label: 'Merk alle',
    						icon: '/images/check.png',
    						action: /*func_9*/ ctx[66]
    					},
    					{
    						label: 'Fjern merking',
    						icon: '/images/nocheck.png',
    						action: /*func_10*/ ctx[67]
    					},
    					{
    						label: 'Tom SMS',
    						icon: '/images/sms.png',
    						action: /*func_11*/ ctx[68]
    					}
    				]
    			}
    		});

    	let each_value = /*tempMsgQueue*/ ctx[25];
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block$1(get_each_context$1(ctx, each_value, i));
    	}

    	const out = i => transition_out(each_blocks[i], 1, 1, () => {
    		each_blocks[i] = null;
    	});

    	return {
    		c() {
    			div = element("div");
    			button = element("button");
    			button.innerHTML = `<img src="/images/wrench.png" width="24" alt="Innstillinger"/>`;
    			t0 = space();
    			h1 = element("h1");
    			h1.textContent = "Loppisadmin";
    			t2 = space();
    			style = element("style");
    			style.textContent = "h1 {text-align: center;}\n\t.conf {position: absolute; padding: 4px; right: 8em}\n\t.conf img {vertical-align: middle;}\n\ttable.main {\n\t\twidth: 80%;\n\t\tmargin-left: 10%;\n\t\tmargin-right: 10%;\n\t\tborder-collapse: collapse;\n\t\tborder: 1px solid grey;\n\t}\n\ttable.main tr:first-child {\n\t\tbackground: #eee;\n\t\tborder-bottom: 1px solid black;\n\t}\n\tth {text-align: left; padding-left: 16px; }\n\tth li {\n\t\tdisplay: inline-block;\n\t\theight: 20px;\n\t\twidth: 20px;\n\t\tborder-bottom: 1px solid grey;\n\t\tcolor: grey;\n\t\tfont-weight: lighter;\n\t\tmargin-left: 8px;\n\t\tcursor: pointer;\n\t}\n\t.smallActive, .mediumActive, .bigActive {\n\t\tborder: 1px solid black;\n\t}\n\t.smallActive, .mediumActive, .bigActive, li.monActive, li.tueActive, li.wedActive, li.thuActive {\n\t\tborder-color: black;\n\t\tcolor: black;\n\t}\n\tlabel {font-weight: lighter; font-style: italic;}\n\n\n/* Extra small devices (phones, 600px and down) */\n@media only screen and (max-width: 600px) {\n\tth:nth-child(3) {display: none;}\n\tth:nth-child(4) {display: none;}\n\tth:nth-child(5) {display: none;}\n\ttable {width: 99%; margin: 0;}\n}\n\n@media only screen and (max-width: 700px) {\n\tth:nth-child(3) {display: none;}\n\t.stufftype {width: 25%}\n\t.dayscol {width: 25%}\n\ttable {width: 95%; margin: 2.5%;}\n}\n/* column styles */\n.jobnr {\n\twidth: 2%;\n}\n.address {\n\tbackground: #eee;\n\twidth: 25%;\n}\n.cartype {\n\twidth: 5%;\n}\n.quality {\n\twidth: 10%;\n}\n.stufftype {\n\twidth: 10%;\n}\n.dayscol {\n\twidth: 20%;\n}\n.status {\n\twidth: 15%;\n}\n.dataloading {\n\tposition: fixed;\n\tleft: 45%;\n\tright: 50%;\n\ttop: 45%;\n\tbottom: 50%;\n}";
    			t4 = space();
    			info.block.c();
    			t5 = space();
    			create_component(menu0.$$.fragment);
    			t6 = space();
    			create_component(menu1.$$.fragment);
    			t7 = space();

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			attr(button, "class", "conf");
    			attr(style, "type", "text/css");
    		},
    		m(target, anchor) {
    			insert(target, div, anchor);
    			append(div, button);
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

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(div, null);
    			}

    			current = true;

    			if (!mounted) {
    				dispose = [
    					listen(button, "click", stop_propagation(/*click_handler*/ ctx[36])),
    					listen(div, "contextmenu", prevent_default(/*contextmenu_handler*/ ctx[69])),
    					listen(div, "click", /*click_handler_7*/ ctx[70]),
    					listen(div, "mousedown", /*mousedown_handler*/ ctx[71]),
    					listen(div, "mousemove", /*mousemove_handler*/ ctx[72])
    				];

    				mounted = true;
    			}
    		},
    		p(new_ctx, dirty) {
    			ctx = new_ctx;
    			info.ctx = ctx;

    			if (dirty[0] & /*promise*/ 32 && promise_1 !== (promise_1 = /*promise*/ ctx[5]) && handle_promise(promise_1, info)) ; else {
    				update_await_block_branch(info, ctx, dirty);
    			}

    			const menu0_changes = {};
    			if (dirty[0] & /*showMenu*/ 8) menu0_changes.show = /*showMenu*/ ctx[3];
    			if (dirty[0] & /*menuX*/ 8388608) menu0_changes.x = /*menuX*/ ctx[23];
    			if (dirty[0] & /*menuY*/ 16777216) menu0_changes.y = /*menuY*/ ctx[24];

    			if (dirty[0] & /*showStateEditor, showMenu*/ 12) menu0_changes.items = [
    				{
    					label: 'SMS til giver',
    					icon: '/images/sms.png',
    					action: /*func_3*/ ctx[60]
    				},
    				{
    					label: 'SMS til henter',
    					icon: '/images/sms.png',
    					action: /*func_4*/ ctx[61]
    				},
    				{
    					label: 'Sett status',
    					icon: '/images/wrench.png',
    					action: /*func_5*/ ctx[62]
    				},
    				{
    					label: 'Vis på kart',
    					icon: '/images/map.png',
    					action: /*func_6*/ ctx[63]
    				}
    			];

    			menu0.$set(menu0_changes);
    			const menu1_changes = {};
    			if (dirty[0] & /*showConfigMenu*/ 16) menu1_changes.show = /*showConfigMenu*/ ctx[4];
    			if (dirty[0] & /*menuX*/ 8388608) menu1_changes.x = /*menuX*/ ctx[23];
    			if (dirty[0] & /*menuY*/ 16777216) menu1_changes.y = /*menuY*/ ctx[24];

    			if (dirty[0] & /*showDriverEditor, showConfigMenu, selectedItems, smsEditorType*/ 262163) menu1_changes.items = [
    				{
    					label: 'Hentere',
    					icon: '/images/smallcar.png',
    					action: /*func_7*/ ctx[64]
    				},
    				{
    					label: 'Oppdater data',
    					icon: '/images/wrench.png',
    					action: /*func_8*/ ctx[65]
    				},
    				{
    					label: 'Merk alle',
    					icon: '/images/check.png',
    					action: /*func_9*/ ctx[66]
    				},
    				{
    					label: 'Fjern merking',
    					icon: '/images/nocheck.png',
    					action: /*func_10*/ ctx[67]
    				},
    				{
    					label: 'Tom SMS',
    					icon: '/images/sms.png',
    					action: /*func_11*/ ctx[68]
    				}
    			];

    			menu1.$set(menu1_changes);

    			if (dirty[0] & /*tempMsgQueue*/ 33554432) {
    				each_value = /*tempMsgQueue*/ ctx[25];
    				let i;

    				for (i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context$1(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    						transition_in(each_blocks[i], 1);
    					} else {
    						each_blocks[i] = create_each_block$1(child_ctx);
    						each_blocks[i].c();
    						transition_in(each_blocks[i], 1);
    						each_blocks[i].m(div, null);
    					}
    				}

    				group_outros();

    				for (i = each_value.length; i < each_blocks.length; i += 1) {
    					out(i);
    				}

    				check_outros();
    			}
    		},
    		i(local) {
    			if (current) return;
    			transition_in(info.block);
    			transition_in(menu0.$$.fragment, local);
    			transition_in(menu1.$$.fragment, local);

    			for (let i = 0; i < each_value.length; i += 1) {
    				transition_in(each_blocks[i]);
    			}

    			current = true;
    		},
    		o(local) {
    			for (let i = 0; i < 3; i += 1) {
    				const block = info.blocks[i];
    				transition_out(block);
    			}

    			transition_out(menu0.$$.fragment, local);
    			transition_out(menu1.$$.fragment, local);
    			each_blocks = each_blocks.filter(Boolean);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				transition_out(each_blocks[i]);
    			}

    			current = false;
    		},
    		d(detaching) {
    			if (detaching) detach(div);
    			info.block.d();
    			info.token = null;
    			info = null;
    			destroy_component(menu0);
    			destroy_component(menu1);
    			destroy_each(each_blocks, detaching);
    			mounted = false;
    			run_all(dispose);
    		}
    	};
    }

    let monActive = true;

    function instance$1($$self, $$props, $$invalidate) {
    	let $jobs;
    	let $drivers;
    	component_subscribe($$self, jobs, $$value => $$invalidate(26, $jobs = $$value));
    	component_subscribe($$self, drivers, $$value => $$invalidate(74, $drivers = $$value));
    	let smsEditorType = '';
    	let showDriverEditor = false;
    	let showStateEditor = false;
    	let showMenu = false;
    	let showConfigMenu = false;
    	let promise = getData();
    	let freeTextFilter = '';
    	let bigActive = true;
    	let mediumActive = true;
    	let smallActive = true;
    	let qualityFilter = '';
    	let tueActive = true;
    	let wedActive = true;
    	let thuActive = true;
    	let dayFilterExclusive = false;
    	let typeFilter = '';
    	let prefs;
    	let cols;
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

    	async function getData(forceReload) {
    		let res = await fetch(`${apiUrl}/prefs`);
    		$$invalidate(16, prefs = await res.json());
    		$$invalidate(17, cols = prefs.cols);
    		res = await fetch(`${apiUrl}/jobs` + (forceReload ? '?refresh=1' : ''));

    		if (res.ok) {
    			let json = await res.json();
    			json.sort((a, b) => a[cols.ADDRESS] < b[cols.ADDRESS] ? -1 : 1);
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

    	getToken().then(t => helperToken = t);

    	function reload() {
    		$$invalidate(5, promise = getData(true));
    	}

    	function updatedSelectedList(event) {
    		let detail = event.detail; // {jobnr: 1, selected: true }

    		if (detail.selected && selectedItems.indexOf(detail.jobnr) === -1) {
    			$$invalidate(18, selectedItems = [...selectedItems, detail.jobnr]);
    		} else if (!detail.selected && selectedItems.indexOf(detail.jobnr) > -1) {
    			selectedItems.splice(selectedItems.indexOf(detail.jobnr), 1);
    			$$invalidate(18, selectedItems);
    		}
    	}

    	function toggleMenu(targetElm) {
    		if (showMenu) {
    			$$invalidate(3, showMenu = false);
    		} else {
    			let jobNr;
    			let elm = targetElm;

    			while (elm && !jobNr && elm.getAttribute) {
    				jobNr = elm.getAttribute('data-id');
    				elm = elm.parentNode;
    			}

    			if (jobNr && selectedItems.indexOf(jobNr) === -1) {
    				updatedSelectedList({ detail: { selected: true, jobnr: jobNr } });
    			}

    			if (jobNr || selectedItems.length) {
    				$$invalidate(3, showMenu = true);
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

    		while (elm) {
    			if (elm.className && elm.className.indexOf('menu') > -1) {
    				insideMenu = true;
    			}

    			elm = elm.parentNode;
    		}

    		if (insideMenu) {
    			return;
    		}

    		$$invalidate(3, showMenu = false);
    		$$invalidate(4, showConfigMenu = false);
    	}

    	function onMouseDown(evt) {
    		if (showMenu || showConfigMenu) {
    			return;
    		}

    		$$invalidate(23, menuX = event.clientX);

    		// nudge menu left- og rightwards if the touch or
    		//mouse cursor is too near edge
    		if (menuX < window.innerWidth * 0.2) {
    			$$invalidate(23, menuX += window.innerWidth * 0.1);
    		}

    		if (menuX >= window.innerWidth - 200) {
    			$$invalidate(23, menuX -= 200);
    		}

    		$$invalidate(24, menuY = event.clientY);
    	}

    	function flashMessage(message, isError) {
    		$$invalidate(25, tempMsgQueue = [...tempMsgQueue, { message, isError }]);
    		setTimeout(() => $$invalidate(25, tempMsgQueue = tempMsgQueue.slice(0, tempMsgQueue.length - 1)), 5000);
    	}

    	function initSms(type) {
    		$$invalidate(3, showMenu = false);

    		let items = selectedItems.map(item => $jobs.find(job => job[cols.JOBNR] === item)).filter(item => filter(
    			freeTextFilter,
    			{ smallActive, mediumActive, bigActive },
    			{
    				monActive,
    				tueActive,
    				wedActive,
    				thuActive,
    				dayFilterExclusive
    			},
    			typeFilter,
    			qualityFilter,
    			hideDoneJobs,
    			drivers,
    			item,
    			cols
    		));

    		if (type === 'donor') {
    			$$invalidate(19, possibleRecipients = items.map(item => ({
    				name: item[cols.CONTACT_PERSON],
    				number: item[cols.PHONE],
    				address: item[cols.ADDRESS]
    			})));

    			$$invalidate(20, recipients = items.map(item => item[cols.PHONE]));
    			$$invalidate(0, smsEditorType = type);
    		} else {
    			$$invalidate(19, possibleRecipients = $drivers);

    			$$invalidate(21, message = 'Hei, foreslår at du henter følgende jobb(er): \n\n' + items.map(item => `${item[cols.ADDRESS]}
${item[cols.CONTACT_PERSON]}, ${item[cols.PHONE]}`).join('\n\n'));

    			$$invalidate(21, message += `

Merk jobber som hentet her etterpå:
${baseUrl}/henting/?jobb=${encodeURIComponent(items.map(item => getIdFromUrl(item[cols.JOBNR])).join(','))}&token=${encodeURIComponent(helperToken)}&henter={number}`);

    			$$invalidate(0, smsEditorType = type);
    		}
    	}

    	function selectAllShown() {
    		$$invalidate(18, selectedItems.length = 0, selectedItems);

    		$jobs.forEach(item => {
    			if (filter(
    				freeTextFilter,
    				{ smallActive, mediumActive, bigActive },
    				{
    					monActive,
    					tueActive,
    					wedActive,
    					thuActive,
    					dayFilterExclusive
    				},
    				typeFilter,
    				qualityFilter,
    				hideDoneJobs,
    				drivers,
    				item,
    				cols
    			)) {
    				selectedItems.push(item[cols.JOBNR]);
    			}
    		});
    	}

    	function openMap() {
    		let str = gMapsDirection + selectedItems.map(item => {
    			let data = $jobs.find(job => job[cols.JOBNR] === item);
    			return data[cols.ADDRESS];
    		}).join('/');

    		window.open(str);
    	}

    	jobs.subscribe(data => {
    		console.log('updated data! ', data);
    	});

    	const click_handler = e => {
    		$$invalidate(4, showConfigMenu = true);
    	};

    	function input0_input_handler() {
    		freeTextFilter = this.value;
    		$$invalidate(6, freeTextFilter);
    	}

    	const click_handler_1 = e => $$invalidate(7, bigActive = !bigActive);
    	const click_handler_2 = e => $$invalidate(8, mediumActive = !mediumActive);
    	const click_handler_3 = e => $$invalidate(9, smallActive = !smallActive);

    	function select0_change_handler() {
    		typeFilter = select_value(this);
    		$$invalidate(15, typeFilter);
    		$$invalidate(16, prefs);
    	}

    	function select1_change_handler() {
    		qualityFilter = select_value(this);
    		$$invalidate(10, qualityFilter);
    	}

    	const click_handler_4 = e => $$invalidate(11, tueActive = !tueActive);
    	const click_handler_5 = e => $$invalidate(12, wedActive = !wedActive);
    	const click_handler_6 = e => $$invalidate(13, thuActive = !thuActive);

    	function input1_change_handler() {
    		dayFilterExclusive = this.checked;
    		$$invalidate(14, dayFilterExclusive);
    	}

    	function input2_change_handler() {
    		hideDoneJobs = this.checked;
    		$$invalidate(22, hideDoneJobs);
    	}

    	const select_handler = e => updatedSelectedList(e);
    	const func = item => item[cols.STATUS] === 'Hentes';
    	const func_1 = item => item[cols.STATUS] === 'Hentet';
    	const func_2 = item => item[cols.STATUS] === 'Hentes ikke';

    	const cancel_handler = e => {
    		$$invalidate(0, smsEditorType = '');
    		$$invalidate(21, message = '');
    		$$invalidate(19, possibleRecipients = null);
    	};

    	const sms_handler = e => {
    		sendSms(e.detail.recipients, e.detail.message).then(() => {
    			flashMessage('SMS sendt til ' + e.detail.recipients);

    			return Promise.all(selectedItems.map(item => {
    				const job = $jobs.find(job => job[cols.JOBNR] === item);

    				if (e.detail.smsEditorType === 'worker') {
    					return changeJobDetails(item, cols, { [cols.STATUS]: 'Sendt til henter' });
    				} else if (e.detail.smsEditorType === 'donor' && job && ['', 'Ny'].includes(job[cols.STATUS])) {
    					return changeJobDetails(item, cols, { [cols.STATUS]: 'Kontaktet' });
    				}

    				return Promise.resolve();
    			})).then(() => {
    				$$invalidate(18, selectedItems.length = 0, selectedItems);
    			});
    		}).catch(err => flashMessage(err, true));

    		$$invalidate(21, message = '');
    		$$invalidate(19, possibleRecipients = null);
    		$$invalidate(0, smsEditorType = '');
    	};

    	const close_handler = () => $$invalidate(0, smsEditorType = '');

    	const cancel_handler_1 = e => {
    		$$invalidate(1, showDriverEditor = false);
    	};

    	const close_handler_1 = () => $$invalidate(1, showDriverEditor = false);

    	const cancel_handler_2 = e => {
    		$$invalidate(2, showStateEditor = false);
    	};

    	const statusupdate_handler = e => {
    		if (e.detail.newState) {
    			selectedItems.forEach(item => {
    				let data = $jobs.find(job => job[cols.JOBNR] === item);

    				if (data[cols.ASSIGNEE]) {
    					return; // don't update state behind assignee's back..
    				}

    				changeJobDetails(item, cols, { [cols.STATUS]: e.detail.newState });
    			});
    		}

    		$$invalidate(2, showStateEditor = false);
    	};

    	const close_handler_2 = () => $$invalidate(2, showStateEditor = false);
    	const func_3 = e => initSms('donor');
    	const func_4 = e => initSms('worker');
    	const func_5 = e => ($$invalidate(2, showStateEditor = true), $$invalidate(3, showMenu = false));
    	const func_6 = e => (openMap(), $$invalidate(3, showMenu = false));
    	const func_7 = e => ($$invalidate(1, showDriverEditor = true), $$invalidate(4, showConfigMenu = false));
    	const func_8 = e => ($$invalidate(4, showConfigMenu = false), reload());
    	const func_9 = e => ($$invalidate(4, showConfigMenu = false), selectAllShown());
    	const func_10 = e => ($$invalidate(4, showConfigMenu = false), $$invalidate(18, selectedItems.length = 0, selectedItems));
    	const func_11 = e => ($$invalidate(4, showConfigMenu = false), $$invalidate(0, smsEditorType = 'new'));

    	const contextmenu_handler = e => {
    		toggleMenu(e.target);
    	};

    	const click_handler_7 = e => considerClosingMenu(e);
    	const mousedown_handler = e => onMouseDown();
    	const mousemove_handler = e => onMouseDown();

    	return [
    		smsEditorType,
    		showDriverEditor,
    		showStateEditor,
    		showMenu,
    		showConfigMenu,
    		promise,
    		freeTextFilter,
    		bigActive,
    		mediumActive,
    		smallActive,
    		qualityFilter,
    		tueActive,
    		wedActive,
    		thuActive,
    		dayFilterExclusive,
    		typeFilter,
    		prefs,
    		cols,
    		selectedItems,
    		possibleRecipients,
    		recipients,
    		message,
    		hideDoneJobs,
    		menuX,
    		menuY,
    		tempMsgQueue,
    		$jobs,
    		reload,
    		updatedSelectedList,
    		toggleMenu,
    		considerClosingMenu,
    		onMouseDown,
    		flashMessage,
    		initSms,
    		selectAllShown,
    		openMap,
    		click_handler,
    		input0_input_handler,
    		click_handler_1,
    		click_handler_2,
    		click_handler_3,
    		select0_change_handler,
    		select1_change_handler,
    		click_handler_4,
    		click_handler_5,
    		click_handler_6,
    		input1_change_handler,
    		input2_change_handler,
    		select_handler,
    		func,
    		func_1,
    		func_2,
    		cancel_handler,
    		sms_handler,
    		close_handler,
    		cancel_handler_1,
    		close_handler_1,
    		cancel_handler_2,
    		statusupdate_handler,
    		close_handler_2,
    		func_3,
    		func_4,
    		func_5,
    		func_6,
    		func_7,
    		func_8,
    		func_9,
    		func_10,
    		func_11,
    		contextmenu_handler,
    		click_handler_7,
    		mousedown_handler,
    		mousemove_handler
    	];
    }

    class App extends SvelteComponent {
    	constructor(options) {
    		super();
    		init(this, options, instance$1, create_fragment$1, safe_not_equal, {}, null, [-1, -1, -1]);
    	}
    }

    /* client/src/ShowSingleJob.svelte generated by Svelte v3.49.0 */

    function add_css(target) {
    	append_styles(target, "svelte-uo1le0", ".loading.svelte-uo1le0.svelte-uo1le0{position:fixed;left:45%;right:50%;top:45%;bottom:50%}h1.svelte-uo1le0.svelte-uo1le0{text-align:center}section.svelte-uo1le0.svelte-uo1le0{display:table;width:90%;margin-left:5%;border:1px solid black;padding:8px}section.svelte-uo1le0 p.svelte-uo1le0{display:table-row;border-bottom:1px solid grey}section.svelte-uo1le0 p b.svelte-uo1le0,section.svelte-uo1le0 p span.svelte-uo1le0,section.svelte-uo1le0 p i.svelte-uo1le0{display:table-cell;border:8px solid transparent;vertical-align:top}section.svelte-uo1le0 p b.svelte-uo1le0:first-child{width:5%}@media only screen and (min-width: 700px){section.svelte-uo1le0.svelte-uo1le0{width:60%;margin-left:20%}section.svelte-uo1le0 p b.svelte-uo1le0:first-child{width:15%}section.svelte-uo1le0 p b.svelte-uo1le0,section.svelte-uo1le0 p span.svelte-uo1le0,section.svelte-uo1le0 p i.svelte-uo1le0{border:16px solid transparent}}button.svelte-uo1le0.svelte-uo1le0{margin-bottom:8px;font-size:1.2em}.commonmap.svelte-uo1le0.svelte-uo1le0{text-align:center}textarea.svelte-uo1le0.svelte-uo1le0{height:100px;width:100%;font-size:1em}.Hentet.svelte-uo1le0.svelte-uo1le0{border-color:green;background:#fefffe;position:relative;overflow:hidden}.Hentet.svelte-uo1le0 .hideondone.svelte-uo1le0{display:none}.Hentet.svelte-uo1le0.svelte-uo1le0:after{position:absolute;line-height:32px;text-align:center;top:24px;right:40px;width:70%;transform-origin:40% 90%;opacity:0.5;transform:translate(35%, -30%) rotate(35deg);font-size:1.5em}.Hentet.svelte-uo1le0.svelte-uo1le0:after{content:'Hentet';background-color:yellow}.jobnr.svelte-uo1le0.svelte-uo1le0{display:inline-block;height:100%;padding:4px;background:#aaa;float:right}");
    }

    function get_each_context(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[18] = list[i];
    	child_ctx[19] = list;
    	child_ctx[20] = i;
    	return child_ctx;
    }

    // (251:0) {:catch error}
    function create_catch_block(ctx) {
    	let p;
    	let t_value = /*error*/ ctx[21].message + "";
    	let t;

    	return {
    		c() {
    			p = element("p");
    			t = text(t_value);
    			set_style(p, "color", "red");
    		},
    		m(target, anchor) {
    			insert(target, p, anchor);
    			append(p, t);
    		},
    		p(ctx, dirty) {
    			if (dirty & /*promise*/ 2 && t_value !== (t_value = /*error*/ ctx[21].message + "")) set_data(t, t_value);
    		},
    		i: noop,
    		o: noop,
    		d(detaching) {
    			if (detaching) detach(p);
    		}
    	};
    }

    // (150:0) {:then data}
    function create_then_block(ctx) {
    	let h1;
    	let t1;
    	let t2;
    	let t3;
    	let hr;
    	let t4;
    	let button;
    	let current;
    	let mounted;
    	let dispose;
    	let if_block = /*$jobs*/ ctx[3].length > 1 && create_if_block_7(ctx);
    	let each_value = /*$jobs*/ ctx[3];
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block(get_each_context(ctx, each_value, i));
    	}

    	const out = i => transition_out(each_blocks[i], 1, 1, () => {
    		each_blocks[i] = null;
    	});

    	return {
    		c() {
    			h1 = element("h1");
    			h1.textContent = "Hentinger";
    			t1 = space();
    			if (if_block) if_block.c();
    			t2 = space();

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			t3 = space();
    			hr = element("hr");
    			t4 = space();
    			button = element("button");
    			button.textContent = "Alle mine jobber";
    			attr(h1, "class", "svelte-uo1le0");
    			attr(button, "class", "p8 br2 svelte-uo1le0");
    		},
    		m(target, anchor) {
    			insert(target, h1, anchor);
    			insert(target, t1, anchor);
    			if (if_block) if_block.m(target, anchor);
    			insert(target, t2, anchor);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(target, anchor);
    			}

    			insert(target, t3, anchor);
    			insert(target, hr, anchor);
    			insert(target, t4, anchor);
    			insert(target, button, anchor);
    			current = true;

    			if (!mounted) {
    				dispose = listen(button, "click", /*click_handler_4*/ ctx[14]);
    				mounted = true;
    			}
    		},
    		p(ctx, dirty) {
    			if (/*$jobs*/ ctx[3].length > 1) {
    				if (if_block) {
    					if_block.p(ctx, dirty);
    				} else {
    					if_block = create_if_block_7(ctx);
    					if_block.c();
    					if_block.m(t2.parentNode, t2);
    				}
    			} else if (if_block) {
    				if_block.d(1);
    				if_block = null;
    			}

    			if (dirty & /*$jobs, prefs, update, params, normalizeNumber, gMapsDirection*/ 45) {
    				each_value = /*$jobs*/ ctx[3];
    				let i;

    				for (i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    						transition_in(each_blocks[i], 1);
    					} else {
    						each_blocks[i] = create_each_block(child_ctx);
    						each_blocks[i].c();
    						transition_in(each_blocks[i], 1);
    						each_blocks[i].m(t3.parentNode, t3);
    					}
    				}

    				group_outros();

    				for (i = each_value.length; i < each_blocks.length; i += 1) {
    					out(i);
    				}

    				check_outros();
    			}
    		},
    		i(local) {
    			if (current) return;

    			for (let i = 0; i < each_value.length; i += 1) {
    				transition_in(each_blocks[i]);
    			}

    			current = true;
    		},
    		o(local) {
    			each_blocks = each_blocks.filter(Boolean);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				transition_out(each_blocks[i]);
    			}

    			current = false;
    		},
    		d(detaching) {
    			if (detaching) detach(h1);
    			if (detaching) detach(t1);
    			if (if_block) if_block.d(detaching);
    			if (detaching) detach(t2);
    			destroy_each(each_blocks, detaching);
    			if (detaching) detach(t3);
    			if (detaching) detach(hr);
    			if (detaching) detach(t4);
    			if (detaching) detach(button);
    			mounted = false;
    			dispose();
    		}
    	};
    }

    // (152:1) {#if $jobs.length > 1}
    function create_if_block_7(ctx) {
    	let p;
    	let a;
    	let t;
    	let br;
    	let img;
    	let img_src_value;
    	let a_href_value;

    	return {
    		c() {
    			p = element("p");
    			a = element("a");
    			t = text("Kart med alle adresser: ");
    			br = element("br");
    			img = element("img");
    			if (!src_url_equal(img.src, img_src_value = "/images/map.png")) attr(img, "src", img_src_value);
    			attr(img, "alt", "alle adresser i kart");
    			attr(img, "width", "36");
    			attr(a, "href", a_href_value = gMapsDirection + /*$jobs*/ ctx[3].map(/*func*/ ctx[6]).join('/'));
    			attr(a, "target", "_blank");
    			attr(p, "class", "commonmap svelte-uo1le0");
    		},
    		m(target, anchor) {
    			insert(target, p, anchor);
    			append(p, a);
    			append(a, t);
    			append(a, br);
    			append(a, img);
    		},
    		p(ctx, dirty) {
    			if (dirty & /*$jobs, prefs*/ 12 && a_href_value !== (a_href_value = gMapsDirection + /*$jobs*/ ctx[3].map(/*func*/ ctx[6]).join('/'))) {
    				attr(a, "href", a_href_value);
    			}
    		},
    		d(detaching) {
    			if (detaching) detach(p);
    		}
    	};
    }

    // (158:2) {#if job.loading}
    function create_if_block_6(ctx) {
    	let div;
    	let loadingicon;
    	let current;
    	loadingicon = new LoadingIcon({});

    	return {
    		c() {
    			div = element("div");
    			create_component(loadingicon.$$.fragment);
    			attr(div, "class", "loading svelte-uo1le0");
    		},
    		m(target, anchor) {
    			insert(target, div, anchor);
    			mount_component(loadingicon, div, null);
    			current = true;
    		},
    		i(local) {
    			if (current) return;
    			transition_in(loadingicon.$$.fragment, local);
    			current = true;
    		},
    		o(local) {
    			transition_out(loadingicon.$$.fragment, local);
    			current = false;
    		},
    		d(detaching) {
    			if (detaching) detach(div);
    			destroy_component(loadingicon);
    		}
    	};
    }

    // (180:3) {#if job[prefs.cols.DESC]}
    function create_if_block_5(ctx) {
    	let p;
    	let b;
    	let i;
    	let t1_value = /*job*/ ctx[18][/*prefs*/ ctx[2].cols.DESC] + "";
    	let t1;

    	return {
    		c() {
    			p = element("p");
    			b = element("b");
    			b.textContent = "Om loppene: ";
    			i = element("i");
    			t1 = text(t1_value);
    			attr(b, "class", "svelte-uo1le0");
    			attr(i, "class", "svelte-uo1le0");
    			attr(p, "class", "svelte-uo1le0");
    		},
    		m(target, anchor) {
    			insert(target, p, anchor);
    			append(p, b);
    			append(p, i);
    			append(i, t1);
    		},
    		p(ctx, dirty) {
    			if (dirty & /*$jobs, prefs*/ 12 && t1_value !== (t1_value = /*job*/ ctx[18][/*prefs*/ ctx[2].cols.DESC] + "")) set_data(t1, t1_value);
    		},
    		d(detaching) {
    			if (detaching) detach(p);
    		}
    	};
    }

    // (196:5) {#if job[prefs.cols.ASSIGNEE] && job[prefs.cols.ASSIGNEE] === params.henter}
    function create_if_block_2(ctx) {
    	let current_block_type_index;
    	let if_block;
    	let if_block_anchor;
    	let current;
    	const if_block_creators = [create_if_block_3, create_if_block_4];
    	const if_blocks = [];

    	function select_block_type(ctx, dirty) {
    		if (/*job*/ ctx[18][/*prefs*/ ctx[2].cols.STATUS] === 'Hentes') return 0;
    		if (/*job*/ ctx[18][/*prefs*/ ctx[2].cols.STATUS] === 'Hentet') return 1;
    		return -1;
    	}

    	if (~(current_block_type_index = select_block_type(ctx))) {
    		if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);
    	}

    	return {
    		c() {
    			if (if_block) if_block.c();
    			if_block_anchor = empty();
    		},
    		m(target, anchor) {
    			if (~current_block_type_index) {
    				if_blocks[current_block_type_index].m(target, anchor);
    			}

    			insert(target, if_block_anchor, anchor);
    			current = true;
    		},
    		p(ctx, dirty) {
    			let previous_block_index = current_block_type_index;
    			current_block_type_index = select_block_type(ctx);

    			if (current_block_type_index !== previous_block_index) {
    				if (if_block) {
    					group_outros();

    					transition_out(if_blocks[previous_block_index], 1, 1, () => {
    						if_blocks[previous_block_index] = null;
    					});

    					check_outros();
    				}

    				if (~current_block_type_index) {
    					if_block = if_blocks[current_block_type_index];

    					if (!if_block) {
    						if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);
    						if_block.c();
    					}

    					transition_in(if_block, 1);
    					if_block.m(if_block_anchor.parentNode, if_block_anchor);
    				} else {
    					if_block = null;
    				}
    			}
    		},
    		i(local) {
    			if (current) return;
    			transition_in(if_block);
    			current = true;
    		},
    		o(local) {
    			transition_out(if_block);
    			current = false;
    		},
    		d(detaching) {
    			if (~current_block_type_index) {
    				if_blocks[current_block_type_index].d(detaching);
    			}

    			if (detaching) detach(if_block_anchor);
    		}
    	};
    }

    // (200:52) 
    function create_if_block_4(ctx) {
    	let br0;
    	let t0;
    	let em;
    	let em_transition;
    	let current;

    	return {
    		c() {
    			br0 = element("br");
    			t0 = space();
    			em = element("em");
    			em.innerHTML = `<br/>★ ★ ☺  Takk for at du hentet!  ☺ ★ ★`;
    		},
    		m(target, anchor) {
    			insert(target, br0, anchor);
    			insert(target, t0, anchor);
    			insert(target, em, anchor);
    			current = true;
    		},
    		i(local) {
    			if (current) return;

    			add_render_callback(() => {
    				if (!em_transition) em_transition = create_bidirectional_transition(em, fade, {}, true);
    				em_transition.run(1);
    			});

    			current = true;
    		},
    		o(local) {
    			if (!em_transition) em_transition = create_bidirectional_transition(em, fade, {}, false);
    			em_transition.run(0);
    			current = false;
    		},
    		d(detaching) {
    			if (detaching) detach(br0);
    			if (detaching) detach(t0);
    			if (detaching) detach(em);
    			if (detaching && em_transition) em_transition.end();
    		}
    	};
    }

    // (197:6) {#if job[prefs.cols.STATUS] === 'Hentes'}
    function create_if_block_3(ctx) {
    	let br0;
    	let t0;
    	let em;
    	let em_transition;
    	let current;

    	return {
    		c() {
    			br0 = element("br");
    			t0 = space();
    			em = element("em");
    			em.innerHTML = `<br/>★ ★ ☺   Du har tatt på deg jobben - takk!  ☺ ★ ★`;
    		},
    		m(target, anchor) {
    			insert(target, br0, anchor);
    			insert(target, t0, anchor);
    			insert(target, em, anchor);
    			current = true;
    		},
    		i(local) {
    			if (current) return;

    			add_render_callback(() => {
    				if (!em_transition) em_transition = create_bidirectional_transition(em, fade, {}, true);
    				em_transition.run(1);
    			});

    			current = true;
    		},
    		o(local) {
    			if (!em_transition) em_transition = create_bidirectional_transition(em, fade, {}, false);
    			em_transition.run(0);
    			current = false;
    		},
    		d(detaching) {
    			if (detaching) detach(br0);
    			if (detaching) detach(t0);
    			if (detaching) detach(em);
    			if (detaching && em_transition) em_transition.end();
    		}
    	};
    }

    // (205:5) {#if job[prefs.cols.ASSIGNEE] && job[prefs.cols.ASSIGNEE] !== params.henter}
    function create_if_block_1(ctx) {
    	let br;
    	let t0;
    	let em;
    	let b;
    	let t1;
    	let a;
    	let t2_value = normalizeNumber(/*job*/ ctx[18][/*prefs*/ ctx[2].cols.ASSIGNEE]) + "";
    	let t2;
    	let a_href_value;
    	let t3;

    	return {
    		c() {
    			br = element("br");
    			t0 = space();
    			em = element("em");
    			b = element("b");
    			t1 = text("Merk: jobben er akseptert av en annen. Sjekk med ");
    			a = element("a");
    			t2 = text(t2_value);
    			t3 = text(" om du vurderer å hente.");
    			attr(a, "href", a_href_value = 'tel:' + normalizeNumber(/*job*/ ctx[18][/*prefs*/ ctx[2].cols.ASSIGNEE]));
    			attr(b, "class", "svelte-uo1le0");
    		},
    		m(target, anchor) {
    			insert(target, br, anchor);
    			insert(target, t0, anchor);
    			insert(target, em, anchor);
    			append(em, b);
    			append(b, t1);
    			append(b, a);
    			append(a, t2);
    			append(b, t3);
    		},
    		p(ctx, dirty) {
    			if (dirty & /*$jobs, prefs*/ 12 && t2_value !== (t2_value = normalizeNumber(/*job*/ ctx[18][/*prefs*/ ctx[2].cols.ASSIGNEE]) + "")) set_data(t2, t2_value);

    			if (dirty & /*$jobs, prefs*/ 12 && a_href_value !== (a_href_value = 'tel:' + normalizeNumber(/*job*/ ctx[18][/*prefs*/ ctx[2].cols.ASSIGNEE]))) {
    				attr(a, "href", a_href_value);
    			}
    		},
    		d(detaching) {
    			if (detaching) detach(br);
    			if (detaching) detach(t0);
    			if (detaching) detach(em);
    		}
    	};
    }

    // (232:5) {:else}
    function create_else_block(ctx) {
    	let button;
    	let mounted;
    	let dispose;

    	function click_handler_3(...args) {
    		return /*click_handler_3*/ ctx[13](/*job*/ ctx[18], ...args);
    	}

    	return {
    		c() {
    			button = element("button");
    			button.textContent = "Vi tar jobben!";
    			attr(button, "class", "p8 br2 svelte-uo1le0");
    		},
    		m(target, anchor) {
    			insert(target, button, anchor);

    			if (!mounted) {
    				dispose = listen(button, "click", click_handler_3);
    				mounted = true;
    			}
    		},
    		p(new_ctx, dirty) {
    			ctx = new_ctx;
    		},
    		d(detaching) {
    			if (detaching) detach(button);
    			mounted = false;
    			dispose();
    		}
    	};
    }

    // (213:5) {#if job[prefs.cols.ASSIGNEE] === params.henter && job[prefs.cols.STATUS] === 'Hentes'}
    function create_if_block(ctx) {
    	let button0;
    	let t1;
    	let button1;
    	let t3;
    	let button2;
    	let mounted;
    	let dispose;

    	function click_handler(...args) {
    		return /*click_handler*/ ctx[10](/*job*/ ctx[18], ...args);
    	}

    	function click_handler_1(...args) {
    		return /*click_handler_1*/ ctx[11](/*job*/ ctx[18], ...args);
    	}

    	function click_handler_2(...args) {
    		return /*click_handler_2*/ ctx[12](/*job*/ ctx[18], ...args);
    	}

    	return {
    		c() {
    			button0 = element("button");
    			button0.textContent = "Ferdig hentet!";
    			t1 = space();
    			button1 = element("button");
    			button1.textContent = "Vi rekker ikke å hente likevel";
    			t3 = space();
    			button2 = element("button");
    			button2.textContent = "Jobben skal ikke hentes";
    			attr(button0, "class", "p8 br2 svelte-uo1le0");
    			attr(button1, "class", "p8 br2 svelte-uo1le0");
    			attr(button2, "class", "p8 br2 svelte-uo1le0");
    		},
    		m(target, anchor) {
    			insert(target, button0, anchor);
    			insert(target, t1, anchor);
    			insert(target, button1, anchor);
    			insert(target, t3, anchor);
    			insert(target, button2, anchor);

    			if (!mounted) {
    				dispose = [
    					listen(button0, "click", click_handler),
    					listen(button1, "click", click_handler_1),
    					listen(button2, "click", click_handler_2)
    				];

    				mounted = true;
    			}
    		},
    		p(new_ctx, dirty) {
    			ctx = new_ctx;
    		},
    		d(detaching) {
    			if (detaching) detach(button0);
    			if (detaching) detach(t1);
    			if (detaching) detach(button1);
    			if (detaching) detach(t3);
    			if (detaching) detach(button2);
    			mounted = false;
    			run_all(dispose);
    		}
    	};
    }

    // (157:1) {#each $jobs as job, i}
    function create_each_block(ctx) {
    	let t0;
    	let section;
    	let p0;
    	let b0;
    	let t2;
    	let span0;
    	let t3_value = /*job*/ ctx[18][/*prefs*/ ctx[2].cols.ADDRESS] + "";
    	let t3;
    	let t4;
    	let a;
    	let img;
    	let img_src_value;
    	let a_href_value;
    	let t5;
    	let span1;
    	let t6_value = /*job*/ ctx[18][/*prefs*/ ctx[2].cols.JOBNR] + "";
    	let t6;
    	let t7;
    	let p1;
    	let b1;
    	let t9;
    	let span2;
    	let renderperson;
    	let t10;
    	let p2;
    	let b2;
    	let t12;
    	let span3;
    	let rendertypes;
    	let t13;
    	let t14;
    	let p3;
    	let b3;
    	let span4;
    	let renderstars;
    	let t16;
    	let p4;
    	let b4;
    	let t18;
    	let span5;
    	let textarea;
    	let t19;
    	let p5;
    	let b5;
    	let span6;
    	let em;
    	let t21_value = /*job*/ ctx[18][/*prefs*/ ctx[2].cols.STATUS] + "";
    	let t21;
    	let t22;
    	let br;
    	let t23;
    	let t24;
    	let t25;
    	let p6;
    	let b6;
    	let span7;
    	let section_class_value;
    	let current;
    	let mounted;
    	let dispose;
    	let if_block0 = /*job*/ ctx[18].loading && create_if_block_6();

    	renderperson = new RenderPerson({
    			props: {
    				name: /*job*/ ctx[18][/*prefs*/ ctx[2].cols.CONTACT_PERSON],
    				number: /*job*/ ctx[18][/*prefs*/ ctx[2].cols.PHONE]
    			}
    		});

    	rendertypes = new RenderTypes({
    			props: {
    				types: /*job*/ ctx[18][/*prefs*/ ctx[2].cols.TYPES],
    				showAll: true
    			}
    		});

    	let if_block1 = /*job*/ ctx[18][/*prefs*/ ctx[2].cols.DESC] && create_if_block_5(ctx);

    	function qualityupdate_handler(...args) {
    		return /*qualityupdate_handler*/ ctx[7](/*job*/ ctx[18], ...args);
    	}

    	renderstars = new RenderStars({
    			props: {
    				qualityRanking: /*job*/ ctx[18][/*prefs*/ ctx[2].cols.QUALITY]
    			}
    		});

    	renderstars.$on("qualityupdate", qualityupdate_handler);

    	function textarea_input_handler() {
    		/*textarea_input_handler*/ ctx[8].call(textarea, /*each_value*/ ctx[19], /*i*/ ctx[20]);
    	}

    	function change_handler(...args) {
    		return /*change_handler*/ ctx[9](/*job*/ ctx[18], ...args);
    	}

    	let if_block2 = /*job*/ ctx[18][/*prefs*/ ctx[2].cols.ASSIGNEE] && /*job*/ ctx[18][/*prefs*/ ctx[2].cols.ASSIGNEE] === /*params*/ ctx[0].henter && create_if_block_2(ctx);
    	let if_block3 = /*job*/ ctx[18][/*prefs*/ ctx[2].cols.ASSIGNEE] && /*job*/ ctx[18][/*prefs*/ ctx[2].cols.ASSIGNEE] !== /*params*/ ctx[0].henter && create_if_block_1(ctx);

    	function select_block_type_1(ctx, dirty) {
    		if (/*job*/ ctx[18][/*prefs*/ ctx[2].cols.ASSIGNEE] === /*params*/ ctx[0].henter && /*job*/ ctx[18][/*prefs*/ ctx[2].cols.STATUS] === 'Hentes') return create_if_block;
    		return create_else_block;
    	}

    	let current_block_type = select_block_type_1(ctx);
    	let if_block4 = current_block_type(ctx);

    	return {
    		c() {
    			if (if_block0) if_block0.c();
    			t0 = space();
    			section = element("section");
    			p0 = element("p");
    			b0 = element("b");
    			b0.textContent = "Adresse:";
    			t2 = space();
    			span0 = element("span");
    			t3 = text(t3_value);
    			t4 = space();
    			a = element("a");
    			img = element("img");
    			t5 = space();
    			span1 = element("span");
    			t6 = text(t6_value);
    			t7 = space();
    			p1 = element("p");
    			b1 = element("b");
    			b1.textContent = "Kontaktperson:";
    			t9 = space();
    			span2 = element("span");
    			create_component(renderperson.$$.fragment);
    			t10 = space();
    			p2 = element("p");
    			b2 = element("b");
    			b2.textContent = "Typer:";
    			t12 = space();
    			span3 = element("span");
    			create_component(rendertypes.$$.fragment);
    			t13 = space();
    			if (if_block1) if_block1.c();
    			t14 = space();
    			p3 = element("p");
    			b3 = element("b");
    			b3.textContent = "Estimert kvalitet: ";
    			span4 = element("span");
    			create_component(renderstars.$$.fragment);
    			t16 = space();
    			p4 = element("p");
    			b4 = element("b");
    			b4.textContent = "Administrators/henteres kommentarer:";
    			t18 = space();
    			span5 = element("span");
    			textarea = element("textarea");
    			t19 = space();
    			p5 = element("p");
    			b5 = element("b");
    			b5.textContent = "Status: ";
    			span6 = element("span");
    			em = element("em");
    			t21 = text(t21_value);
    			t22 = space();
    			br = element("br");
    			t23 = space();
    			if (if_block2) if_block2.c();
    			t24 = space();
    			if (if_block3) if_block3.c();
    			t25 = space();
    			p6 = element("p");
    			b6 = element("b");
    			b6.textContent = "Oppdater status:";
    			span7 = element("span");
    			if_block4.c();
    			attr(b0, "class", "svelte-uo1le0");
    			if (!src_url_equal(img.src, img_src_value = "/images/map.png")) attr(img, "src", img_src_value);
    			attr(img, "alt", "adresse i kart");
    			attr(img, "width", "24");
    			attr(a, "href", a_href_value = gMapsDirection + /*job*/ ctx[18][/*prefs*/ ctx[2].cols.ADDRESS]);
    			attr(a, "target", "_blank");
    			attr(span0, "class", "svelte-uo1le0");
    			attr(span1, "class", "jobnr svelte-uo1le0");
    			attr(p0, "class", "svelte-uo1le0");
    			attr(b1, "class", "svelte-uo1le0");
    			attr(span2, "class", "svelte-uo1le0");
    			attr(p1, "class", "svelte-uo1le0");
    			attr(b2, "class", "svelte-uo1le0");
    			attr(span3, "class", "svelte-uo1le0");
    			attr(p2, "class", "hideondone svelte-uo1le0");
    			attr(b3, "class", "svelte-uo1le0");
    			attr(span4, "class", "svelte-uo1le0");
    			attr(p3, "class", "hideondone svelte-uo1le0");
    			attr(b4, "class", "svelte-uo1le0");
    			attr(textarea, "class", "svelte-uo1le0");
    			attr(span5, "class", "svelte-uo1le0");
    			attr(p4, "class", "hideondone svelte-uo1le0");
    			attr(b5, "class", "svelte-uo1le0");
    			attr(span6, "class", "svelte-uo1le0");
    			attr(p5, "class", "svelte-uo1le0");
    			attr(b6, "class", "svelte-uo1le0");
    			attr(span7, "class", "svelte-uo1le0");
    			attr(p6, "class", "hideondone svelte-uo1le0");
    			attr(section, "class", section_class_value = "" + (null_to_empty(/*job*/ ctx[18][/*prefs*/ ctx[2].cols.STATUS]) + " svelte-uo1le0"));
    		},
    		m(target, anchor) {
    			if (if_block0) if_block0.m(target, anchor);
    			insert(target, t0, anchor);
    			insert(target, section, anchor);
    			append(section, p0);
    			append(p0, b0);
    			append(p0, t2);
    			append(p0, span0);
    			append(span0, t3);
    			append(span0, t4);
    			append(span0, a);
    			append(a, img);
    			append(p0, t5);
    			append(p0, span1);
    			append(span1, t6);
    			append(section, t7);
    			append(section, p1);
    			append(p1, b1);
    			append(p1, t9);
    			append(p1, span2);
    			mount_component(renderperson, span2, null);
    			append(section, t10);
    			append(section, p2);
    			append(p2, b2);
    			append(p2, t12);
    			append(p2, span3);
    			mount_component(rendertypes, span3, null);
    			append(section, t13);
    			if (if_block1) if_block1.m(section, null);
    			append(section, t14);
    			append(section, p3);
    			append(p3, b3);
    			append(p3, span4);
    			mount_component(renderstars, span4, null);
    			append(section, t16);
    			append(section, p4);
    			append(p4, b4);
    			append(p4, t18);
    			append(p4, span5);
    			append(span5, textarea);
    			set_input_value(textarea, /*job*/ ctx[18][/*prefs*/ ctx[2].cols.ADMCOMMENT]);
    			append(section, t19);
    			append(section, p5);
    			append(p5, b5);
    			append(p5, span6);
    			append(span6, em);
    			append(em, t21);
    			append(span6, t22);
    			append(span6, br);
    			append(span6, t23);
    			if (if_block2) if_block2.m(span6, null);
    			append(span6, t24);
    			if (if_block3) if_block3.m(span6, null);
    			append(section, t25);
    			append(section, p6);
    			append(p6, b6);
    			append(p6, span7);
    			if_block4.m(span7, null);
    			current = true;

    			if (!mounted) {
    				dispose = [
    					listen(textarea, "input", textarea_input_handler),
    					listen(textarea, "change", change_handler)
    				];

    				mounted = true;
    			}
    		},
    		p(new_ctx, dirty) {
    			ctx = new_ctx;

    			if (/*job*/ ctx[18].loading) {
    				if (if_block0) {
    					if (dirty & /*$jobs*/ 8) {
    						transition_in(if_block0, 1);
    					}
    				} else {
    					if_block0 = create_if_block_6();
    					if_block0.c();
    					transition_in(if_block0, 1);
    					if_block0.m(t0.parentNode, t0);
    				}
    			} else if (if_block0) {
    				group_outros();

    				transition_out(if_block0, 1, 1, () => {
    					if_block0 = null;
    				});

    				check_outros();
    			}

    			if ((!current || dirty & /*$jobs, prefs*/ 12) && t3_value !== (t3_value = /*job*/ ctx[18][/*prefs*/ ctx[2].cols.ADDRESS] + "")) set_data(t3, t3_value);

    			if (!current || dirty & /*$jobs, prefs*/ 12 && a_href_value !== (a_href_value = gMapsDirection + /*job*/ ctx[18][/*prefs*/ ctx[2].cols.ADDRESS])) {
    				attr(a, "href", a_href_value);
    			}

    			if ((!current || dirty & /*$jobs, prefs*/ 12) && t6_value !== (t6_value = /*job*/ ctx[18][/*prefs*/ ctx[2].cols.JOBNR] + "")) set_data(t6, t6_value);
    			const renderperson_changes = {};
    			if (dirty & /*$jobs, prefs*/ 12) renderperson_changes.name = /*job*/ ctx[18][/*prefs*/ ctx[2].cols.CONTACT_PERSON];
    			if (dirty & /*$jobs, prefs*/ 12) renderperson_changes.number = /*job*/ ctx[18][/*prefs*/ ctx[2].cols.PHONE];
    			renderperson.$set(renderperson_changes);
    			const rendertypes_changes = {};
    			if (dirty & /*$jobs, prefs*/ 12) rendertypes_changes.types = /*job*/ ctx[18][/*prefs*/ ctx[2].cols.TYPES];
    			rendertypes.$set(rendertypes_changes);

    			if (/*job*/ ctx[18][/*prefs*/ ctx[2].cols.DESC]) {
    				if (if_block1) {
    					if_block1.p(ctx, dirty);
    				} else {
    					if_block1 = create_if_block_5(ctx);
    					if_block1.c();
    					if_block1.m(section, t14);
    				}
    			} else if (if_block1) {
    				if_block1.d(1);
    				if_block1 = null;
    			}

    			const renderstars_changes = {};
    			if (dirty & /*$jobs, prefs*/ 12) renderstars_changes.qualityRanking = /*job*/ ctx[18][/*prefs*/ ctx[2].cols.QUALITY];
    			renderstars.$set(renderstars_changes);

    			if (dirty & /*$jobs, prefs*/ 12) {
    				set_input_value(textarea, /*job*/ ctx[18][/*prefs*/ ctx[2].cols.ADMCOMMENT]);
    			}

    			if ((!current || dirty & /*$jobs, prefs*/ 12) && t21_value !== (t21_value = /*job*/ ctx[18][/*prefs*/ ctx[2].cols.STATUS] + "")) set_data(t21, t21_value);

    			if (/*job*/ ctx[18][/*prefs*/ ctx[2].cols.ASSIGNEE] && /*job*/ ctx[18][/*prefs*/ ctx[2].cols.ASSIGNEE] === /*params*/ ctx[0].henter) {
    				if (if_block2) {
    					if_block2.p(ctx, dirty);

    					if (dirty & /*$jobs, prefs, params*/ 13) {
    						transition_in(if_block2, 1);
    					}
    				} else {
    					if_block2 = create_if_block_2(ctx);
    					if_block2.c();
    					transition_in(if_block2, 1);
    					if_block2.m(span6, t24);
    				}
    			} else if (if_block2) {
    				group_outros();

    				transition_out(if_block2, 1, 1, () => {
    					if_block2 = null;
    				});

    				check_outros();
    			}

    			if (/*job*/ ctx[18][/*prefs*/ ctx[2].cols.ASSIGNEE] && /*job*/ ctx[18][/*prefs*/ ctx[2].cols.ASSIGNEE] !== /*params*/ ctx[0].henter) {
    				if (if_block3) {
    					if_block3.p(ctx, dirty);
    				} else {
    					if_block3 = create_if_block_1(ctx);
    					if_block3.c();
    					if_block3.m(span6, null);
    				}
    			} else if (if_block3) {
    				if_block3.d(1);
    				if_block3 = null;
    			}

    			if (current_block_type === (current_block_type = select_block_type_1(ctx)) && if_block4) {
    				if_block4.p(ctx, dirty);
    			} else {
    				if_block4.d(1);
    				if_block4 = current_block_type(ctx);

    				if (if_block4) {
    					if_block4.c();
    					if_block4.m(span7, null);
    				}
    			}

    			if (!current || dirty & /*$jobs, prefs*/ 12 && section_class_value !== (section_class_value = "" + (null_to_empty(/*job*/ ctx[18][/*prefs*/ ctx[2].cols.STATUS]) + " svelte-uo1le0"))) {
    				attr(section, "class", section_class_value);
    			}
    		},
    		i(local) {
    			if (current) return;
    			transition_in(if_block0);
    			transition_in(renderperson.$$.fragment, local);
    			transition_in(rendertypes.$$.fragment, local);
    			transition_in(renderstars.$$.fragment, local);
    			transition_in(if_block2);
    			current = true;
    		},
    		o(local) {
    			transition_out(if_block0);
    			transition_out(renderperson.$$.fragment, local);
    			transition_out(rendertypes.$$.fragment, local);
    			transition_out(renderstars.$$.fragment, local);
    			transition_out(if_block2);
    			current = false;
    		},
    		d(detaching) {
    			if (if_block0) if_block0.d(detaching);
    			if (detaching) detach(t0);
    			if (detaching) detach(section);
    			destroy_component(renderperson);
    			destroy_component(rendertypes);
    			if (if_block1) if_block1.d();
    			destroy_component(renderstars);
    			if (if_block2) if_block2.d();
    			if (if_block3) if_block3.d();
    			if_block4.d();
    			mounted = false;
    			run_all(dispose);
    		}
    	};
    }

    // (148:16)   <div class="loading"><LoadingIcon /></div> {:then data}
    function create_pending_block(ctx) {
    	let div;
    	let loadingicon;
    	let current;
    	loadingicon = new LoadingIcon({});

    	return {
    		c() {
    			div = element("div");
    			create_component(loadingicon.$$.fragment);
    			attr(div, "class", "loading svelte-uo1le0");
    		},
    		m(target, anchor) {
    			insert(target, div, anchor);
    			mount_component(loadingicon, div, null);
    			current = true;
    		},
    		p: noop,
    		i(local) {
    			if (current) return;
    			transition_in(loadingicon.$$.fragment, local);
    			current = true;
    		},
    		o(local) {
    			transition_out(loadingicon.$$.fragment, local);
    			current = false;
    		},
    		d(detaching) {
    			if (detaching) detach(div);
    			destroy_component(loadingicon);
    		}
    	};
    }

    function create_fragment(ctx) {
    	let await_block_anchor;
    	let promise_1;
    	let current;

    	let info = {
    		ctx,
    		current: null,
    		token: null,
    		hasCatch: true,
    		pending: create_pending_block,
    		then: create_then_block,
    		catch: create_catch_block,
    		value: 17,
    		error: 21,
    		blocks: [,,,]
    	};

    	handle_promise(promise_1 = /*promise*/ ctx[1], info);

    	return {
    		c() {
    			await_block_anchor = empty();
    			info.block.c();
    		},
    		m(target, anchor) {
    			insert(target, await_block_anchor, anchor);
    			info.block.m(target, info.anchor = anchor);
    			info.mount = () => await_block_anchor.parentNode;
    			info.anchor = await_block_anchor;
    			current = true;
    		},
    		p(new_ctx, [dirty]) {
    			ctx = new_ctx;
    			info.ctx = ctx;

    			if (dirty & /*promise*/ 2 && promise_1 !== (promise_1 = /*promise*/ ctx[1]) && handle_promise(promise_1, info)) ; else {
    				update_await_block_branch(info, ctx, dirty);
    			}
    		},
    		i(local) {
    			if (current) return;
    			transition_in(info.block);
    			current = true;
    		},
    		o(local) {
    			for (let i = 0; i < 3; i += 1) {
    				const block = info.blocks[i];
    				transition_out(block);
    			}

    			current = false;
    		},
    		d(detaching) {
    			if (detaching) detach(await_block_anchor);
    			info.block.d(detaching);
    			info.token = null;
    			info = null;
    		}
    	};
    }

    function instance($$self, $$props, $$invalidate) {
    	let $jobs;
    	component_subscribe($$self, jobs, $$value => $$invalidate(3, $jobs = $$value));
    	let params, promise;
    	let prefs;

    	if (typeof location !== "undefined") {
    		params = location.search.substr(1).split(/&/g).map(item => {
    			let parts = item.split(/=/);
    			return { [parts[0]]: decodeURIComponent(parts[1]) };
    		}).reduce((all, now) => Object.assign(all, now), {});
    	}

    	if (params && (params.token && params.jobb)) {
    		promise = getData(params.token, params.jobb);
    	}

    	function normalizeJobList(jobs) {
    		jobs = jobs.sort((a, b) => a[prefs.cols.ADDRESS] < b[prefs.cols.ADDRESS] ? -1 : 1);

    		jobs.forEach(job => {
    			job.oldStatus = job[prefs.cols.STATUS] === 'Hentes'
    			? null
    			: job[prefs.cols.STATUS];
    		});

    		return jobs;
    	}

    	async function getData(token, ids) {
    		let res = await fetch(`${apiUrl}/prefs`);
    		$$invalidate(2, prefs = await res.json());
    		res = await fetch(`${apiUrl}/job/${encodeURIComponent(ids)}?token=${encodeURIComponent(token)}`);
    		let json = await res.json();

    		if (res.ok) {
    			json = normalizeJobList(json);
    			jobs.set(json);
    		} else {
    			let text = await res.text();
    			console.log(text);
    			throw new Error('Ingen tilgang');
    		}
    	}

    	async function getDataByAssignee(token, number) {
    		const res = await fetch(`${apiUrl}/byperson/${encodeURIComponent(number)}?token=${encodeURIComponent(token)}`);
    		let json = await res.json();

    		if (res.ok) {
    			json = normalizeJobList(json);
    			jobs.set(json);
    		} else {
    			let text = await res.text();
    			console.log(text);
    			throw new Error('Ingen tilgang');
    		}
    	}

    	function update(jobnr, detail) {
    		return changeJobDetails(jobnr, prefs.cols, detail, params.token).catch(err => alert(err));
    	}

    	jobs.subscribe(data => {
    		console.log('updated data! ', data);
    	});

    	const func = job => job[prefs.cols.ADDRESS];
    	const qualityupdate_handler = (job, e) => update(job[prefs.cols.JOBNR], e.detail);

    	function textarea_input_handler(each_value, i) {
    		each_value[i][prefs.cols.ADMCOMMENT] = this.value;
    		jobs.set($jobs);
    	}

    	const change_handler = (job, e) => update(job[prefs.cols.JOBNR], { [prefs.cols.ADMCOMMENT]: e.target.value });

    	const click_handler = (job, e) => update(job[prefs.cols.JOBNR], {
    		[prefs.cols.STATUS]: 'Hentet',
    		[prefs.cols.ASSIGNEE]: params.henter
    	});

    	const click_handler_1 = (job, e) => update(job[prefs.cols.JOBNR], {
    		[prefs.cols.STATUS]: job.oldStatus || 'Ny',
    		[prefs.cols.ASSIGNEE]: ''
    	});

    	const click_handler_2 = (job, e) => update(job[prefs.cols.JOBNR], {
    		[prefs.cols.STATUS]: 'Hentes ikke',
    		[prefs.cols.ASSIGNEE]: ''
    	});

    	const click_handler_3 = (job, e) => update(job[prefs.cols.JOBNR], {
    		[prefs.cols.STATUS]: 'Hentes',
    		[prefs.cols.ASSIGNEE]: params.henter
    	});

    	const click_handler_4 = e => $$invalidate(1, promise = getDataByAssignee(params.token, params.henter));

    	return [
    		params,
    		promise,
    		prefs,
    		$jobs,
    		getDataByAssignee,
    		update,
    		func,
    		qualityupdate_handler,
    		textarea_input_handler,
    		change_handler,
    		click_handler,
    		click_handler_1,
    		click_handler_2,
    		click_handler_3,
    		click_handler_4
    	];
    }

    class ShowSingleJob extends SvelteComponent {
    	constructor(options) {
    		super();
    		init(this, options, instance, create_fragment, safe_not_equal, {}, add_css);
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

})();
//# sourceMappingURL=bundle.js.map
