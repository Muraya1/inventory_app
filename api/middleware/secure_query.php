<?php

function secure_query(PDO $pdo, string $sql, array $params = []): PDOStatement
{
    $start = microtime(true);

    $stmt = $pdo->prepare($sql);
    $stmt->execute($params);

    $duration = round((microtime(true) - $start) * 1000, 2);

    file_put_contents(
        __DIR__ . '/../logs/sql.log',
        json_encode([
            'timestamp' => date('Y-m-d H:i:s'),
            'sql'       => $sql,
            'params'    => $params,
            'time_ms'   => $duration
        ]) . PHP_EOL,
        FILE_APPEND
    );

    return $stmt;
}

       