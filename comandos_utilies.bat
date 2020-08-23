# Generar parser de Translator
jison ./src/Translator/Grammar.jison -o src/Translator/TranslatorParser.js ; copy src/Translator/TranslatorParser.js ./build/Translator/

# Generar parser de Runner
jison ./src/Runner/Grammar.jison -o src/Runner/RunnerParser.js ; copy src/Translator/RunnerParser.js ./build/Runner/ 