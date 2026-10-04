import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';

void main() {
  test('UNIQUE brand colors are represented as valid material colors', () {
    const red = Color(0xFFE50914);
    const gold = Color(0xFFF5B900);
    final scheme = ColorScheme.fromSeed(seedColor: red, primary: red, secondary: gold);
    expect(scheme.primary, red);
    expect(scheme.secondary, gold);
  });
}
