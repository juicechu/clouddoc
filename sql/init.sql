-- phpMyAdmin SQL Dump
-- version 4.5.4.1
-- http://www.phpmyadmin.net
--
-- Host: localhost
-- Generation Time: May 15, 2016 at 03:24 PM
-- Server version: 5.7.11
-- PHP Version: 5.6.18

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `clouddoc`
--

-- --------------------------------------------------------

--
-- Table structure for table `config`
--

CREATE TABLE `config` (
  `id` int(11) NOT NULL,
  `name` varchar(50) DEFAULT NULL,
  `value` varchar(50) DEFAULT NULL
) ENGINE=MyISAM DEFAULT CHARSET=utf8;

--
-- Dumping data for table `config`
--

INSERT INTO `config` (`id`, `name`, `value`) VALUES
(1, 'QINIU_ACCESS_KEY', ''),
(2, 'QINIU_SECRET_KEY', ''),
(3, 'QINIU_UP_HOST', 'http://upload.qiniu.com'),
(4, 'QINIU_RS_HOST', 'http://rs.qbox.me'),
(5, 'QINIU_RSF_HOST', 'http://rsf.qbox.me'),
(6, 'BUCKET', 'pchou002');

-- --------------------------------------------------------

--
-- Table structure for table `upload_file`
--

CREATE TABLE `upload_file` (
  `id` int(11) NOT NULL,
  `type` int(11) DEFAULT NULL,
  `parent_id` int(11) DEFAULT NULL,
  `owner_account_id` int(11) DEFAULT NULL,
  `file_name` varchar(500) DEFAULT NULL,
  `order_x` int(11) DEFAULT NULL,
  `is_processing` int(11) DEFAULT NULL,
  `is_publish` int(11) DEFAULT NULL,
  `create_time` datetime DEFAULT NULL,
  `mod_time` datetime DEFAULT NULL,
  `is_dir_viewable` int(11) DEFAULT NULL,
  `bucket` varchar(500) DEFAULT NULL,
  `file_size` bigint(20) DEFAULT NULL,
  `persistent_id` varchar(500) DEFAULT NULL,
  `mime_type` varchar(1000) DEFAULT NULL,
  `key_orignal` varchar(500) DEFAULT NULL,
  `key_preview` varchar(500) DEFAULT NULL,
  `key_thumb` varchar(500) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

--
-- Indexes for dumped tables
--

--
-- Indexes for table `config`
--
ALTER TABLE `config`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `name` (`name`);

--
-- Indexes for table `upload_file`
--
ALTER TABLE `upload_file`
  ADD PRIMARY KEY (`id`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `config`
--
ALTER TABLE `config`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=7;
--
-- AUTO_INCREMENT for table `upload_file`
--
ALTER TABLE `upload_file`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=1;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
