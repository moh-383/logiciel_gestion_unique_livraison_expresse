import 'dart:async';
import 'dart:convert';

import 'package:dio/dio.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:geolocator/geolocator.dart';
import 'package:firebase_core/firebase_core.dart';
import 'package:firebase_messaging/firebase_messaging.dart';
import 'package:shared_preferences/shared_preferences.dart';

import 'firebase_options.dart';

const _red = Color(0xFFE50914);
const _gold = Color(0xFFF5B900);
const _storage = FlutterSecureStorage();
const _apiBase = String.fromEnvironment(
  'API_BASE_URL',
  defaultValue: 'http://10.0.2.2:3000/api',
);
@pragma('vm:entry-point')
Future<void> _firebaseBackgroundHandler(RemoteMessage message) async {
  if (Firebase.apps.isEmpty) {
    await Firebase.initializeApp(
      options: DefaultFirebaseOptions.currentPlatform,
    );
  }
}

Future<void> main() async {
  WidgetsFlutterBinding.ensureInitialized();
  await Firebase.initializeApp(options: DefaultFirebaseOptions.currentPlatform);
  FirebaseMessaging.onBackgroundMessage(_firebaseBackgroundHandler);
  runApp(const UniqueApp());
}

class UniqueApp extends StatelessWidget {
  const UniqueApp({super.key});
  @override
  Widget build(BuildContext context) => MaterialApp(
    title: 'UNIQUE Livraison',
    debugShowCheckedModeBanner: false,
    theme: ThemeData(
      colorScheme: ColorScheme.fromSeed(
        seedColor: _red,
        primary: _red,
        secondary: _gold,
      ),
      useMaterial3: true,
      scaffoldBackgroundColor: const Color(0xFFF7F7F7),
      appBarTheme: const AppBarTheme(
        backgroundColor: Colors.white,
        foregroundColor: Colors.black,
        elevation: 0,
      ),
    ),
    home: const SessionGate(),
  );
}

class Api {
  static const _queueKey = 'pendingApiActions';
  static StreamSubscription<String>? _tokenRefresh;
  Api()
    : dio = Dio(
        BaseOptions(
          baseUrl: _apiBase,
          connectTimeout: const Duration(seconds: 10),
          receiveTimeout: const Duration(seconds: 15),
        ),
      ) {
    dio.interceptors.add(
      InterceptorsWrapper(
        onRequest: (options, handler) async {
          final token = await _storage.read(key: 'accessToken');
          if (token != null) options.headers['Authorization'] = 'Bearer $token';
          handler.next(options);
        },
        onError: (error, handler) async {
          if (error.response?.statusCode != 401 ||
              error.requestOptions.path == '/auth/refresh') {
            return handler.next(error);
          }
          final refresh = await _storage.read(key: 'refreshToken');
          if (refresh == null) return handler.next(error);
          try {
            final pair = await Dio(BaseOptions(baseUrl: _apiBase))
                .post('/auth/refresh', data: {'refreshToken': refresh});
            await _savePair(pair.data as Map<String, dynamic>);
            final opts = error.requestOptions;
            opts.headers['Authorization'] =
                'Bearer ${pair.data['accessToken']}';
            handler.resolve(await dio.fetch(opts));
          } catch (_) {
            handler.next(error);
          }
        },
      ),
    );
  }
  final Dio dio;
  Future<void> login(String phone, String password) async {
    final result = await dio.post(
      '/auth/login',
      data: {'telephone': phone, 'motDePasse': password},
    );
    final user = Map<String, dynamic>.from(result.data['utilisateur'] as Map);
    if (user['role'] != 'LIVREUR') {
      throw Exception('Ce compte n’est pas un compte livreur.');
    }
    await _savePair(Map<String, dynamic>.from(result.data as Map));
    await _storage.write(key: 'user', value: jsonEncode(user));
    try {
      await registerPush();
    } catch (_) {
      /* Push remains optional until Firebase is configured. */
    }
  }

  Future<void> _savePair(Map<String, dynamic> pair) async {
    await _storage.write(
      key: 'accessToken',
      value: pair['accessToken'] as String,
    );
    await _storage.write(
      key: 'refreshToken',
      value: pair['refreshToken'] as String,
    );
  }

  Future<void> logout() async {
    await unregisterPush();
    try {
      await dio.post('/auth/logout');
    } catch (_) {}
    await _storage.deleteAll();
  }

  Future<List<Map<String, dynamic>>> myOrders() async =>
      List<Map<String, dynamic>>.from(
        (await dio.get('/commandes/mes-commandes')).data as List,
      );
  Future<Map<String, dynamic>> order(String id) async =>
      Map<String, dynamic>.from((await dio.get('/commandes/$id')).data as Map);
  Future<String?> pendingStatus(String orderId) async {
    for (final action in (await _readQueue()).reversed) {
      if (action['type'] == 'status' && action['orderId'] == orderId) {
        return action['value'] as String;
      }
    }
    return null;
  }

  Future<bool> status(String orderId, String value) async {
    await _enqueue({'type': 'status', 'orderId': orderId, 'value': value});
    return syncPending();
  }

  Future<bool> driverStatus(String id, String value) async {
    await _enqueue({'type': 'driverStatus', 'driverId': id, 'value': value});
    return syncPending();
  }

  Future<void> position(Position p) async {
    try {
      await dio.post(
        '/gps/position',
        data: {'gpsLat': p.latitude, 'gpsLng': p.longitude},
      );
    } on DioException {
      await _enqueue({
        'type': 'gps',
        'gpsLat': p.latitude,
        'gpsLng': p.longitude,
      });
      rethrow;
    }
  }

  Future<int> pendingCount() async => (await _readQueue()).length;
  Future<void> _enqueue(Map<String, dynamic> item) async {
    final queue = await _readQueue();
    if (item['type'] == 'gps') {
      queue.removeWhere((entry) => entry['type'] == 'gps');
    }
    queue.add({...item, 'id': DateTime.now().microsecondsSinceEpoch});
    await _saveQueue(queue);
  }

  Future<List<Map<String, dynamic>>> _readQueue() async {
    final raw = (await SharedPreferences.getInstance()).getString(
      await _queueStorageKey(),
    );
    if (raw == null) return [];
    try {
      return List<Map<String, dynamic>>.from(
        (jsonDecode(raw) as List).map(
          (item) => Map<String, dynamic>.from(item as Map),
        ),
      );
    } catch (_) {
      return [];
    }
  }

  Future<void> _saveQueue(List<Map<String, dynamic>> queue) async {
    await (await SharedPreferences.getInstance()).setString(
      await _queueStorageKey(),
      jsonEncode(queue),
    );
  }

  Future<String> _queueStorageKey() async {
    final rawUser = await _storage.read(key: 'user');
    if (rawUser == null) return '$_queueKey.anonymous';
    try {
      final user = jsonDecode(rawUser) as Map<String, dynamic>;
      return '$_queueKey.${user['id'] ?? 'anonymous'}';
    } catch (_) {
      return '$_queueKey.anonymous';
    }
  }

  Future<bool> syncPending() async {
    final queue = await _readQueue();
    while (queue.isNotEmpty) {
      final action = queue.first;
      try {
        switch (action['type']) {
          case 'status':
            await dio.patch(
              '/commandes/${action['orderId']}/statut',
              data: {'statut': action['value']},
            );
            break;
          case 'driverStatus':
            await dio.patch(
              '/livreurs/${action['driverId']}/statut',
              data: {'statut': action['value']},
            );
            break;
          case 'gps':
            await dio.post(
              '/gps/position',
              data: {'gpsLat': action['gpsLat'], 'gpsLng': action['gpsLng']},
            );
            break;
        }
        queue.removeAt(0);
        await _saveQueue(queue);
      } on DioException catch (error) {
        if (action['type'] == 'status' &&
            (error.response?.statusCode == 400 ||
                error.response?.statusCode == 409)) {
          try {
            final current = await order('${action['orderId']}');
            if (current['statut'] == action['value']) {
              queue.removeAt(0);
              await _saveQueue(queue);
              continue;
            }
          } catch (_) {}
        }
        return false;
      }
    }
    return true;
  }

  Future<void> registerPush() async {
    if (Firebase.apps.isEmpty) return;
    final messaging = FirebaseMessaging.instance;
    await messaging.requestPermission();
    final token = await messaging.getToken();
    if (token != null) {
      await dio.post('/auth/device-token', data: {'token': token});
    }
    _tokenRefresh ??= messaging.onTokenRefresh.listen((value) {
      dio.post('/auth/device-token', data: {'token': value});
    });
  }

  Future<void> unregisterPush() async {
    if (Firebase.apps.isEmpty) return;
    await _tokenRefresh?.cancel();
    _tokenRefresh = null;
    try {
      await dio.post('/auth/device-token', data: {'token': null});
    } catch (_) {}
  }
}

class SessionGate extends StatefulWidget {
  const SessionGate({super.key});
  @override
  State<SessionGate> createState() => _SessionGateState();
}

class _SessionGateState extends State<SessionGate> {
  Map<String, dynamic>? user;
  @override
  void initState() {
    super.initState();
    _restore();
  }

  Future<void> _restore() async {
    final raw = await _storage.read(key: 'user');
    if (!mounted) return;
    setState(
      () => user = raw == null
          ? null
          : Map<String, dynamic>.from(jsonDecode(raw) as Map),
    );
  }

  @override
  Widget build(BuildContext context) => user == null
      ? LoginPage(onLogin: (u) => setState(() => user = u))
      : OrdersPage(user: user!, onLogout: () => setState(() => user = null));
}

class LoginPage extends StatefulWidget {
  const LoginPage({required this.onLogin, super.key});
  final ValueChanged<Map<String, dynamic>> onLogin;
  @override
  State<LoginPage> createState() => _LoginPageState();
}

class _LoginPageState extends State<LoginPage> {
  final phone = TextEditingController(), password = TextEditingController();
  final api = Api();
  bool busy = false;
  String? error;
  @override
  void dispose() {
    phone.dispose();
    password.dispose();
    super.dispose();
  }

  Future<void> submit() async {
    setState(() {
      busy = true;
      error = null;
    });
    try {
      await api.login(phone.text.trim(), password.text);
      final raw = await _storage.read(key: 'user');
      if (raw != null && mounted) {
        widget.onLogin(Map<String, dynamic>.from(jsonDecode(raw) as Map));
      }
    } catch (e) {
      if (mounted) {
        setState(
          () => error = e is DioException
              ? (e.response?.data?['message']?.toString() ??
                    'Serveur inaccessible à $_apiBase')
              : e.toString().replaceFirst('Exception: ', ''),
        );
      }
    } finally {
      if (mounted) setState(() => busy = false);
    }
  }

  @override
  Widget build(BuildContext context) => Scaffold(
    body: SafeArea(
      child: Center(
        child: SingleChildScrollView(
          padding: const EdgeInsets.all(26),
          child: ConstrainedBox(
            constraints: const BoxConstraints(maxWidth: 430),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                Image.asset(
                  'assets/brand/logo.png',
                  height: 205,
                  fit: BoxFit.contain,
                ),
                const SizedBox(height: 22),
                const Text(
                  'Espace livreur',
                  style: TextStyle(fontSize: 25, fontWeight: FontWeight.bold),
                ),
                const SizedBox(height: 7),
                const Text('Connectez-vous pour suivre vos missions.'),
                const SizedBox(height: 25),
                TextField(
                  controller: phone,
                  keyboardType: TextInputType.phone,
                  autofillHints: const [AutofillHints.username],
                  decoration: const InputDecoration(
                    labelText: 'Téléphone',
                    border: OutlineInputBorder(),
                    prefixIcon: Icon(Icons.phone),
                  ),
                ),
                const SizedBox(height: 14),
                TextField(
                  controller: password,
                  obscureText: true,
                  onSubmitted: (_) => submit(),
                  decoration: const InputDecoration(
                    labelText: 'Mot de passe',
                    border: OutlineInputBorder(),
                    prefixIcon: Icon(Icons.lock),
                  ),
                ),
                if (error != null)
                  Padding(
                    padding: const EdgeInsets.only(top: 12),
                    child: Text(error!, style: const TextStyle(color: _red)),
                  ),
                const SizedBox(height: 20),
                FilledButton(
                  onPressed: busy ? null : submit,
                  child: Padding(
                    padding: const EdgeInsets.all(13),
                    child: Text(busy ? 'Connexion…' : 'Se connecter'),
                  ),
                ),
                const SizedBox(height: 10),
                Text(
                  _apiBase,
                  textAlign: TextAlign.center,
                  style: const TextStyle(fontSize: 11, color: Colors.grey),
                ),
              ],
            ),
          ),
        ),
      ),
    ),
  );
}

class OrdersPage extends StatefulWidget {
  const OrdersPage({required this.user, required this.onLogout, super.key});
  final Map<String, dynamic> user;
  final VoidCallback onLogout;
  @override
  State<OrdersPage> createState() => _OrdersPageState();
}

class _OrdersPageState extends State<OrdersPage> with WidgetsBindingObserver {
  final api = Api();
  List<Map<String, dynamic>> orders = [];
  bool loading = true, tracking = false;
  String? error;
  Timer? timer;
  String driverId = '', driverStatus = 'DISPONIBLE';
  int pendingActions = 0;
  StreamSubscription<RemoteMessage>? pushSubscription;
  StreamSubscription<RemoteMessage>? pushOpenedSubscription;
  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addObserver(this);
    _loadDriverId();
    _load();
    _startGps();
    _updatePending();
    if (Firebase.apps.isNotEmpty) {
      pushSubscription = FirebaseMessaging.onMessage.listen((_) {
        _load();
      });
      pushOpenedSubscription = FirebaseMessaging.onMessageOpenedApp.listen(
        _openPushedOrder,
      );
      unawaited(_registerPush());
      WidgetsBinding.instance.addPostFrameCallback((_) {
        _handleInitialPush();
      });
    }
  }

  @override
  void dispose() {
    timer?.cancel();
    pushSubscription?.cancel();
    pushOpenedSubscription?.cancel();
    WidgetsBinding.instance.removeObserver(this);
    super.dispose();
  }

  @override
  void didChangeAppLifecycleState(AppLifecycleState state) {
    if (state == AppLifecycleState.resumed) {
      _syncPending();
      _sendGps();
      _load();
      _registerPush();
    }
  }

  Future<void> _registerPush() async {
    try {
      await api.registerPush();
    } catch (_) {
      // Retry after the next resume if permission or connectivity is not ready.
    }
  }

  Future<void> _handleInitialPush() async {
    try {
      final message = await FirebaseMessaging.instance.getInitialMessage();
      if (message != null) await _openPushedOrder(message);
    } catch (_) {}
  }

  Future<void> _openPushedOrder(RemoteMessage message) async {
    final orderId = message.data['commandeId'] ?? message.data['orderId'];
    if (orderId == null || orderId.isEmpty) {
      await _load();
      return;
    }
    try {
      final order = await api.order(orderId);
      if (mounted) await _openOrder(order);
    } catch (_) {
      await _load();
    }
  }

  Future<void> _loadDriverId() async {
    try {
      final token = await _storage.read(key: 'accessToken');
      if (token == null) return;
      final payload = jsonDecode(
        utf8.decode(base64Url.decode(base64Url.normalize(token.split('.')[1]))),
      ) as Map<String, dynamic>;
      final id = payload['livreurId']?.toString() ?? '';
      if (mounted) setState(() => driverId = id);
      if (id.isNotEmpty) {
        final active = await api.myOrders();
        final hasRoute = active.isNotEmpty;
        final initialStatus = hasRoute ? 'EN_LIVRAISON' : 'DISPONIBLE';
        await api.driverStatus(id, initialStatus);
        if (mounted) setState(() => driverStatus = initialStatus);
      }
    } catch (_) {
      if (mounted) {
        setState(() => error = 'Session invalide : reconnectez-vous.');
      }
    }
  }

  Future<void> _load() async {
    setState(() {
      loading = orders.isEmpty;
      error = null;
    });
    try {
      final fresh = await api.myOrders();
      if (mounted) {
        setState(() {
          orders = fresh;
          loading = false;
        });
      }
    } catch (e) {
      if (mounted) {
        setState(() {
          loading = false;
          error = e.toString();
        });
      }
    }
  }

  Future<void> _startGps() async {
    timer?.cancel();
    timer = Timer.periodic(const Duration(seconds: 30), (_) {
      if (WidgetsBinding.instance.lifecycleState == AppLifecycleState.resumed) {
        _syncPending();
        _sendGps();
        _load();
      }
    });
    await _sendGps();
  }

  Future<void> _updatePending() async {
    final count = await api.pendingCount();
    if (mounted) setState(() => pendingActions = count);
  }

  Future<void> _syncPending() async {
    await api.syncPending();
    await _updatePending();
  }

  Future<void> _sendGps() async {
    if (!mounted ||
        WidgetsBinding.instance.lifecycleState != AppLifecycleState.resumed ||
        driverStatus == 'HORS_LIGNE' ||
        driverStatus == 'DESACTIVE') {
      return;
    }
    try {
      var permission = await Geolocator.checkPermission();
      if (permission == LocationPermission.denied) {
        permission = await Geolocator.requestPermission();
      }
      if (permission == LocationPermission.denied ||
          permission == LocationPermission.deniedForever ||
          !await Geolocator.isLocationServiceEnabled()) {
        return;
      }
      final pos = await Geolocator.getCurrentPosition(
        locationSettings: const LocationSettings(
          accuracy: LocationAccuracy.high,
          timeLimit: Duration(seconds: 12),
        ),
      );
      await api.position(pos);
      if (mounted && !tracking) setState(() => tracking = true);
    } catch (_) {
      if (mounted && tracking) setState(() => tracking = false);
    }
  }

  Future<void> _setDriverStatus(String status) async {
    if (driverId.isEmpty) {
      _message('Profil livreur absent de la session. Reconnectez-vous.');
      return;
    }
    try {
      final synced = await api.driverStatus(driverId, status);
      setState(() => driverStatus = status);
      await _updatePending();
      if (status == 'HORS_LIGNE') {
        setState(() => tracking = false);
      } else {
        _sendGps();
      }
      if (!synced) {
        _message(
          'Statut enregistré sur cet appareil; synchronisation en attente.',
        );
      }
    } catch (e) {
      _message('Impossible de changer votre statut : $e');
    }
  }

  Future<void> _logout() async {
    timer?.cancel();
    await api.logout();
    widget.onLogout();
  }

  void _message(String text) {
    if (mounted) {
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(text)));
    }
  }

  @override
  Widget build(BuildContext context) => Scaffold(
    appBar: AppBar(
      title: const Text(
        'UNIQUE · LIVREUR',
        style: TextStyle(fontWeight: FontWeight.w800, letterSpacing: .6),
      ),
      actions: [
        IconButton(
          onPressed: _load,
          icon: const Icon(Icons.refresh),
          tooltip: 'Actualiser',
        ),
        IconButton(
          onPressed: _logout,
          icon: const Icon(Icons.logout),
          tooltip: 'Déconnexion',
        ),
      ],
    ),
    body: RefreshIndicator(
      onRefresh: _load,
      child: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          Card(
            child: Padding(
              padding: const EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    'Bonjour ${widget.user['nom'] ?? ''}',
                    style: const TextStyle(
                      fontWeight: FontWeight.bold,
                      fontSize: 18,
                    ),
                  ),
                  const SizedBox(height: 12),
                  Row(
                    children: [
                      const Icon(Icons.circle, size: 11, color: Colors.green),
                      const SizedBox(width: 8),
                      Expanded(
                        child: Text(
                          tracking
                              ? 'GPS actif · position envoyée pendant l’utilisation'
                              : 'GPS en attente de permission ou de réseau',
                        ),
                      ),
                      DropdownButton<String>(
                        value: driverStatus,
                        items: const [
                          DropdownMenuItem(
                            value: 'DISPONIBLE',
                            child: Text('Disponible'),
                          ),
                          DropdownMenuItem(
                            value: 'EN_LIVRAISON',
                            child: Text('En livraison'),
                          ),
                          DropdownMenuItem(
                            value: 'CHEZ_FOURNISSEUR',
                            child: Text('Chez fournisseur'),
                          ),
                          DropdownMenuItem(
                            value: 'HORS_LIGNE',
                            child: Text('Hors ligne'),
                          ),
                        ],
                        onChanged: (value) {
                          if (value != null) _setDriverStatus(value);
                        },
                      ),
                    ],
                  ),
                ],
              ),
            ),
          ),
          if (pendingActions > 0)
            Card(
              color: const Color(0xFFFFF4D4),
              child: ListTile(
                leading: const Icon(Icons.sync, color: _red),
                title: Text('$pendingActions action(s) en attente'),
                subtitle: const Text(
                  'Elles seront envoyées quand la connexion reviendra.',
                ),
                trailing: IconButton(
                  onPressed: _syncPending,
                  icon: const Icon(Icons.refresh),
                ),
              ),
            ),
          const Padding(
            padding: EdgeInsets.fromLTRB(2, 22, 2, 10),
            child: Text(
              'MES COMMANDES',
              style: TextStyle(fontWeight: FontWeight.w800, letterSpacing: 1),
            ),
          ),
          if (error != null)
            Card(
              child: ListTile(
                leading: const Icon(Icons.wifi_off, color: _red),
                title: const Text('Connexion impossible'),
                subtitle: Text(error!),
                trailing: IconButton(
                  onPressed: _load,
                  icon: const Icon(Icons.refresh),
                ),
              ),
            ),
          if (loading)
            const Padding(
              padding: EdgeInsets.all(35),
              child: Center(child: CircularProgressIndicator(color: _red)),
            ),
          if (!loading && orders.isEmpty && error == null)
            const Card(
              child: Padding(
                padding: EdgeInsets.all(24),
                child: Text(
                  'Aucune commande en cours. Tirez vers le bas pour actualiser.',
                ),
              ),
            ),
          ...orders.map((o) => OrderCard(order: o, onTap: () => _openOrder(o))),
          const SizedBox(height: 20),
          const Text(
            'Les positions GPS sont envoyées toutes les 30 secondes uniquement quand cette app est ouverte et que votre statut est en service.',
            style: TextStyle(color: Colors.black54, fontSize: 12),
          ),
        ],
      ),
    ),
  );
  Future<void> _openOrder(Map<String, dynamic> summary) async {
    Map<String, dynamic> order = summary;
    try {
      order = await api.order('${summary['id']}');
    } catch (_) {
      final queuedStatus = await api.pendingStatus('${summary['id']}');
      if (queuedStatus != null) order = {...summary, 'statut': queuedStatus};
    }
    if (!mounted) return;
    final stages = <String, String>{
      'LIVREUR_AFFECTE': 'Accepter · en route fournisseur',
      'EN_ROUTE_FOURNISSEUR': 'Marchandise récupérée',
      'MARCHANDISE_RECUPEREE': 'En route vers le client',
      'EN_ROUTE_CLIENT': 'Marquer comme livrée',
      'LIVREE': 'Terminer la commande',
    };
    final next = <String, String>{
      'LIVREUR_AFFECTE': 'EN_ROUTE_FOURNISSEUR',
      'EN_ROUTE_FOURNISSEUR': 'MARCHANDISE_RECUPEREE',
      'MARCHANDISE_RECUPEREE': 'EN_ROUTE_CLIENT',
      'EN_ROUTE_CLIENT': 'LIVREE',
      'LIVREE': 'TERMINEE',
    };
    await showModalBottomSheet<void>(
      context: context,
      isScrollControlled: true,
      showDragHandle: true,
      builder: (ctx) => Padding(
        padding: EdgeInsets.fromLTRB(
          20,
          8,
          20,
          MediaQuery.viewInsetsOf(ctx).bottom + 24,
        ),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            Text(
              order['descriptionMarchandise']?.toString() ?? 'Commande',
              style: const TextStyle(fontSize: 20, fontWeight: FontWeight.bold),
            ),
            const SizedBox(height: 10),
            Text('Client : ${order['client']?['nom'] ?? '—'}'),
            Text('Téléphone : ${order['client']?['telephone'] ?? '—'}'),
            Text('Livraison : ${order['adresseLivraison']?['libelle'] ?? '—'}'),
            Text('Fournisseur : ${order['fournisseur']?['nom'] ?? '—'}'),
            Text('Quantité : ${order['quantite'] ?? '—'}'),
            const SizedBox(height: 12),
            Text(
              'Statut : ${_label(order['statut']?.toString() ?? '')}',
              style: const TextStyle(fontWeight: FontWeight.w700),
            ),
            if (next[order['statut']] != null)
              FilledButton(
                onPressed: () async {
                  final target = next[order['statut']]!;
                  Navigator.pop(ctx);
                  try {
                    final orderSynced = await api.status(
                      '${order['id']}',
                      target,
                    );
                    final driverState = target == 'TERMINEE'
                        ? 'DISPONIBLE'
                        : 'EN_LIVRAISON';
                    final driverSynced = await api.driverStatus(
                      driverId,
                      driverState,
                    );
                    if (mounted) setState(() => driverStatus = driverState);
                    await _updatePending();
                    await _load();
                    _message(
                      orderSynced && driverSynced
                          ? 'Statut synchronisé.'
                          : 'Action enregistrée; synchronisation en attente.',
                    );
                  } catch (e) {
                    _message('Échec de mise à jour : $e');
                  }
                },
                child: Text(stages[order['statut']]!),
              ),
            OutlinedButton.icon(
              onPressed: () {
                final lat = order['adresseLivraison']?['gpsLat'],
                    lng = order['adresseLivraison']?['gpsLng'];
                if (lat is num && lng is num) {
                  Clipboard.setData(ClipboardData(text: '$lat, $lng'));
                }
                _message(
                  lat is num && lng is num
                      ? 'Coordonnées copiées : $lat, $lng'
                      : 'Aucune coordonnée pour cette adresse.',
                );
              },
              icon: const Icon(Icons.location_on_outlined),
              label: const Text('Coordonnées de livraison'),
            ),
          ],
        ),
      ),
    );
  }
}

class OrderCard extends StatelessWidget {
  const OrderCard({required this.order, required this.onTap, super.key});
  final Map<String, dynamic> order;
  final VoidCallback onTap;
  @override
  Widget build(BuildContext context) => Card(
    margin: const EdgeInsets.only(bottom: 10),
    child: InkWell(
      borderRadius: BorderRadius.circular(12),
      onTap: onTap,
      child: Padding(
        padding: const EdgeInsets.all(15),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Expanded(
                  child: Text(
                    order['descriptionMarchandise']?.toString() ?? 'Commande',
                    style: const TextStyle(
                      fontWeight: FontWeight.bold,
                      fontSize: 16,
                    ),
                  ),
                ),
                const Icon(Icons.chevron_right),
              ],
            ),
            const SizedBox(height: 8),
            Text('Client · ${order['client']?['nom'] ?? '—'}'),
            Text('Fournisseur · ${order['fournisseur']?['nom'] ?? '—'}'),
            const SizedBox(height: 9),
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
              decoration: BoxDecoration(
                color: const Color(0xFFFFF4D4),
                borderRadius: BorderRadius.circular(30),
              ),
              child: Text(
                _label(order['statut']?.toString() ?? ''),
                style: const TextStyle(
                  fontSize: 12,
                  fontWeight: FontWeight.w700,
                ),
              ),
            ),
          ],
        ),
      ),
    ),
  );
}

String _label(String value) => value
    .toLowerCase()
    .replaceAll('_', ' ')
    .split(' ')
    .map((s) => s.isEmpty ? s : '${s[0].toUpperCase()}${s.substring(1)}')
    .join(' ');
